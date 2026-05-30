package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	tourspb "gateway/proto"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
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

type toursRPCHandler struct {
	client tourspb.ToursServiceClient
}

var publishTourPath = regexp.MustCompile(`^/api/tours/([^/]+)/publish$`)

func writeJSON(w http.ResponseWriter, statusCode int, payload map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("failed to write json response: %v", err)
	}
}

func grpcHTTPStatus(err error) int {
	if err == nil {
		return http.StatusOK
	}

	st, ok := status.FromError(err)
	if !ok {
		return http.StatusBadGateway
	}

	switch st.Code() {
	case codes.InvalidArgument:
		return http.StatusBadRequest
	case codes.Unauthenticated:
		return http.StatusUnauthorized
	case codes.PermissionDenied:
		return http.StatusForbidden
	case codes.NotFound:
		return http.StatusNotFound
	case codes.FailedPrecondition, codes.AlreadyExists, codes.Aborted:
		return http.StatusConflict
	case codes.Unavailable:
		return http.StatusBadGateway
	default:
		return http.StatusInternalServerError
	}
}

func (h toursRPCHandler) handle(w http.ResponseWriter, r *http.Request) bool {
	if r.Method == http.MethodPost {
		matches := publishTourPath.FindStringSubmatch(r.URL.Path)
		if len(matches) == 2 {
			h.publishTour(w, r, matches[1])
			return true
		}
	}

	if r.Method == http.MethodGet && r.URL.Path == "/api/tours/published" {
		h.listPublishedTours(w, r)
		return true
	}

	return false
}

func (h toursRPCHandler) publishTour(w http.ResponseWriter, r *http.Request, tourID string) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	response, err := h.client.PublishTour(ctx, &tourspb.PublishTourRequest{
		TourId:        tourID,
		Authorization: r.Header.Get("Authorization"),
	})
	if err != nil {
		st, _ := status.FromError(err)
		writeJSON(w, grpcHTTPStatus(err), map[string]interface{}{"message": st.Message()})
		return
	}

	var tour interface{}
	if err := json.Unmarshal([]byte(response.GetTourJson()), &tour); err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]interface{}{"message": "Invalid tours RPC response."})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Tour published successfully.",
		"tour":    tour,
	})
}

func (h toursRPCHandler) listPublishedTours(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	response, err := h.client.ListPublishedTours(ctx, &tourspb.ListPublishedToursRequest{
		Authorization: r.Header.Get("Authorization"),
	})
	if err != nil {
		st, _ := status.FromError(err)
		writeJSON(w, grpcHTTPStatus(err), map[string]interface{}{"message": st.Message()})
		return
	}

	var tours interface{}
	if err := json.Unmarshal([]byte(response.GetToursJson()), &tours); err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]interface{}{"message": "Invalid tours RPC response."})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"tours": tours})
}

func main() {
	toursGRPCAddr := os.Getenv("TOURS_GRPC_ADDR")
	if toursGRPCAddr == "" {
		toursGRPCAddr = "tours-service:9093"
	}

	toursConn, err := grpc.NewClient(toursGRPCAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to create tours grpc client: %v", err)
	}
	defer toursConn.Close()

	toursRPC := toursRPCHandler{client: tourspb.NewToursServiceClient(toursConn)}

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
		if toursRPC.handle(w, r) {
			return
		}

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
