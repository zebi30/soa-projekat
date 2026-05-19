package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

type route struct {
	prefix string
	proxy  *httputil.ReverseProxy
}

func newProxy(target string) *httputil.ReverseProxy {
	u, err := url.Parse(target)
	if err != nil {
		log.Fatalf("invalid upstream URL %s: %v", target, err)
	}
	proxy := httputil.NewSingleHostReverseProxy(u)
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("proxy error for %s: %v", r.URL.Path, err)
		http.Error(w, "Bad Gateway", http.StatusBadGateway)
	}
	return proxy
}

func main() {
	routes := []route{
		{"/auth/", newProxy("http://authorization-service:3001")},
		{"/api/blogs", newProxy("http://blogs-service:8082")},
		{"/api/tours", newProxy("http://tours-service:8083")},
		{"/api/positions", newProxy("http://tours-service:8083")},
		{"/simulator", newProxy("http://tours-service:8083")},
		{"/guide", newProxy("http://tours-service:8083")},
		{"/follows", newProxy("http://follower-service:8000")},
		{"/me", newProxy("http://follower-service:8000")},
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		for _, route := range routes {
			if strings.HasPrefix(r.URL.Path, route.prefix) {
				route.proxy.ServeHTTP(w, r)
				return
			}
		}
		http.NotFound(w, r)
	})

	log.Println("Gateway listening on :80")
	log.Fatal(http.ListenAndServe(":80", nil))
}
