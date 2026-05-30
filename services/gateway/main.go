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
	proxy.ModifyResponse = func(resp *http.Response) error {
		resp.Header.Del("Access-Control-Allow-Origin")
		resp.Header.Del("Access-Control-Allow-Methods")
		resp.Header.Del("Access-Control-Allow-Headers")
		resp.Header.Del("Access-Control-Allow-Credentials")
		return nil
	}
	return proxy
}

func setCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Internal-Api-Key")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
}

type toursRPCHandler struct {
	client tourspb.ToursServiceClient
}

var publishTourPath = regexp.MustCompile(`^/api/tours/([^/]+)/publish$`)
var createReviewPath = regexp.MustCompile(`^/api/tours/([^/]+)/reviews$`)
var startExecutionPath = regexp.MustCompile(`^/api/tours/([^/]+)/execution$`)

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
		if matches := publishTourPath.FindStringSubmatch(r.URL.Path); len(matches) == 2 {
			h.publishTour(w, r, matches[1])
			return true
		}
		if matches := createReviewPath.FindStringSubmatch(r.URL.Path); len(matches) == 2 {
			h.createReview(w, r, matches[1])
			return true
		}
		if matches := startExecutionPath.FindStringSubmatch(r.URL.Path); len(matches) == 2 {
			h.startExecution(w, r, matches[1])
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

func (h toursRPCHandler) createReview(w http.ResponseWriter, r *http.Request, tourID string) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var body struct {
		Rating    int32    `json:"rating"`
		Comment   string   `json:"comment"`
		VisitedAt string   `json:"visitedAt"`
		Images    []string `json:"images"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"message": "Invalid request body."})
		return
	}

	response, err := h.client.CreateReview(ctx, &tourspb.CreateReviewRequest{
		TourId:        tourID,
		Authorization: r.Header.Get("Authorization"),
		Rating:        body.Rating,
		Comment:       body.Comment,
		VisitedAt:     body.VisitedAt,
		Images:        body.Images,
	})
	if err != nil {
		st, _ := status.FromError(err)
		writeJSON(w, grpcHTTPStatus(err), map[string]interface{}{"message": st.Message()})
		return
	}

	var review interface{}
	if err := json.Unmarshal([]byte(response.GetReviewJson()), &review); err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]interface{}{"message": "Invalid tours RPC response."})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Review created successfully.",
		"review":  review,
	})
}

func (h toursRPCHandler) startExecution(w http.ResponseWriter, r *http.Request, tourID string) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var body struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"message": "Invalid request body."})
		return
	}

	response, err := h.client.StartExecution(ctx, &tourspb.StartExecutionRequest{
		TourId:        tourID,
		Authorization: r.Header.Get("Authorization"),
		Latitude:      body.Latitude,
		Longitude:     body.Longitude,
	})
	if err != nil {
		st, _ := status.FromError(err)
		writeJSON(w, grpcHTTPStatus(err), map[string]interface{}{"message": st.Message()})
		return
	}

	var execution interface{}
	if err := json.Unmarshal([]byte(response.GetExecutionJson()), &execution); err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]interface{}{"message": "Invalid tours RPC response."})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":   "Tour execution started.",
		"execution": execution,
	})
}

type purchaseRPCHandler struct {
	client tourspb.PurchaseServiceClient
}

func (h purchaseRPCHandler) handle(w http.ResponseWriter, r *http.Request) bool {
	if r.Method == http.MethodPost && r.URL.Path == "/api/cart/checkout" {
		h.checkout(w, r)
		return true
	}

	if r.Method == http.MethodGet && r.URL.Path == "/api/purchases" {
		h.listMyPurchases(w, r)
		return true
	}

	return false
}

func (h purchaseRPCHandler) checkout(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	response, err := h.client.Checkout(ctx, &tourspb.CheckoutRequest{
		Authorization: r.Header.Get("Authorization"),
	})
	if err != nil {
		st, _ := status.FromError(err)
		writeJSON(w, grpcHTTPStatus(err), map[string]interface{}{"message": st.Message()})
		return
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(response.GetResultJson()), &result); err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]interface{}{"message": "Invalid purchase RPC response."})
		return
	}

	result["message"] = "Checkout completed successfully."
	writeJSON(w, http.StatusCreated, result)
}

func (h purchaseRPCHandler) listMyPurchases(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	response, err := h.client.ListMyPurchases(ctx, &tourspb.ListMyPurchasesRequest{
		Authorization: r.Header.Get("Authorization"),
	})
	if err != nil {
		st, _ := status.FromError(err)
		writeJSON(w, grpcHTTPStatus(err), map[string]interface{}{"message": st.Message()})
		return
	}

	var purchases interface{}
	if err := json.Unmarshal([]byte(response.GetPurchasesJson()), &purchases); err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]interface{}{"message": "Invalid purchase RPC response."})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"purchases": purchases})
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

	purchaseGRPCAddr := os.Getenv("PURCHASE_GRPC_ADDR")
	if purchaseGRPCAddr == "" {
		purchaseGRPCAddr = "purchase-service:9094"
	}

	purchaseConn, err := grpc.NewClient(purchaseGRPCAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to create purchase grpc client: %v", err)
	}
	defer purchaseConn.Close()

	purchaseRPC := purchaseRPCHandler{client: tourspb.NewPurchaseServiceClient(purchaseConn)}

	routes := []route{
		{"/auth/", newProxy("http://authorization-service:3001")},
		{"/api/blogs", newProxy("http://blogs-service:8082")},
		{"/api/tours", newProxy("http://tours-service:8083")},
		{"/api/executions", newProxy("http://tours-service:8083")},
		{"/api/positions", newProxy("http://tours-service:8083")},
		{"/simulator", newProxy("http://tours-service:8083")},
		{"/guide", newProxy("http://tours-service:8083")},
		{"/lifecycle", newProxy("http://tours-service:8083")},
		{"/execution", newProxy("http://tours-service:8083")},
		{"/api/cart", newProxy("http://purchase-service:8084")},
		{"/api/purchases", newProxy("http://purchase-service:8084")},
		{"/follows", newProxy("http://follower-service:8000")},
		{"/me", newProxy("http://follower-service:8000")},
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w)

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		if toursRPC.handle(w, r) {
			return
		}

		if purchaseRPC.handle(w, r) {
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
