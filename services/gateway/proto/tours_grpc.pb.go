// Code compatible with protoc-gen-go-grpc output for proto/tours.proto.
package proto

import (
	context "context"

	grpc "google.golang.org/grpc"
	codes "google.golang.org/grpc/codes"
	status "google.golang.org/grpc/status"
)

const ToursService_ServiceDesc_FullMethodName = "/tours.ToursService/"

const (
	ToursService_PublishTour_FullMethodName        = "/tours.ToursService/PublishTour"
	ToursService_ListPublishedTours_FullMethodName = "/tours.ToursService/ListPublishedTours"
)

type ToursServiceClient interface {
	PublishTour(ctx context.Context, in *PublishTourRequest, opts ...grpc.CallOption) (*TourResponse, error)
	ListPublishedTours(ctx context.Context, in *ListPublishedToursRequest, opts ...grpc.CallOption) (*PublishedToursResponse, error)
}

type toursServiceClient struct {
	cc grpc.ClientConnInterface
}

func NewToursServiceClient(cc grpc.ClientConnInterface) ToursServiceClient {
	return &toursServiceClient{cc}
}

func (c *toursServiceClient) PublishTour(ctx context.Context, in *PublishTourRequest, opts ...grpc.CallOption) (*TourResponse, error) {
	out := new(TourResponse)
	err := c.cc.Invoke(ctx, ToursService_PublishTour_FullMethodName, in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *toursServiceClient) ListPublishedTours(ctx context.Context, in *ListPublishedToursRequest, opts ...grpc.CallOption) (*PublishedToursResponse, error) {
	out := new(PublishedToursResponse)
	err := c.cc.Invoke(ctx, ToursService_ListPublishedTours_FullMethodName, in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

type ToursServiceServer interface {
	PublishTour(context.Context, *PublishTourRequest) (*TourResponse, error)
	ListPublishedTours(context.Context, *ListPublishedToursRequest) (*PublishedToursResponse, error)
	mustEmbedUnimplementedToursServiceServer()
}

type UnimplementedToursServiceServer struct{}

func (UnimplementedToursServiceServer) PublishTour(context.Context, *PublishTourRequest) (*TourResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method PublishTour not implemented")
}
func (UnimplementedToursServiceServer) ListPublishedTours(context.Context, *ListPublishedToursRequest) (*PublishedToursResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ListPublishedTours not implemented")
}
func (UnimplementedToursServiceServer) mustEmbedUnimplementedToursServiceServer() {}

func RegisterToursServiceServer(s grpc.ServiceRegistrar, srv ToursServiceServer) {
	s.RegisterService(&ToursService_ServiceDesc, srv)
}

func _ToursService_PublishTour_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(PublishTourRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(ToursServiceServer).PublishTour(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: ToursService_PublishTour_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(ToursServiceServer).PublishTour(ctx, req.(*PublishTourRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _ToursService_ListPublishedTours_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ListPublishedToursRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(ToursServiceServer).ListPublishedTours(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: ToursService_ListPublishedTours_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(ToursServiceServer).ListPublishedTours(ctx, req.(*ListPublishedToursRequest))
	}
	return interceptor(ctx, in, info, handler)
}

var ToursService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "tours.ToursService",
	HandlerType: (*ToursServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "PublishTour",
			Handler:    _ToursService_PublishTour_Handler,
		},
		{
			MethodName: "ListPublishedTours",
			Handler:    _ToursService_ListPublishedTours_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "tours.proto",
}
