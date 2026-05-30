// Code compatible with protoc-gen-go output for proto/tours.proto.
package proto

import (
	reflect "reflect"
	sync "sync"

	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
)

type PublishTourRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	TourId        string `protobuf:"bytes,1,opt,name=tour_id,json=tourId,proto3" json:"tour_id,omitempty"`
	Authorization string `protobuf:"bytes,2,opt,name=authorization,proto3" json:"authorization,omitempty"`
}

func (x *PublishTourRequest) Reset() {
	*x = PublishTourRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_tours_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *PublishTourRequest) String() string { return protoimpl.X.MessageStringOf(x) }
func (*PublishTourRequest) ProtoMessage()    {}
func (x *PublishTourRequest) ProtoReflect() protoreflect.Message {
	mi := &file_tours_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}
func (*PublishTourRequest) Descriptor() ([]byte, []int) {
	return file_tours_proto_rawDescGZIP(), []int{0}
}
func (x *PublishTourRequest) GetTourId() string {
	if x != nil {
		return x.TourId
	}
	return ""
}
func (x *PublishTourRequest) GetAuthorization() string {
	if x != nil {
		return x.Authorization
	}
	return ""
}

type ListPublishedToursRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Authorization string `protobuf:"bytes,1,opt,name=authorization,proto3" json:"authorization,omitempty"`
}

func (x *ListPublishedToursRequest) Reset() {
	*x = ListPublishedToursRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_tours_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}
func (x *ListPublishedToursRequest) String() string { return protoimpl.X.MessageStringOf(x) }
func (*ListPublishedToursRequest) ProtoMessage()    {}
func (x *ListPublishedToursRequest) ProtoReflect() protoreflect.Message {
	mi := &file_tours_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}
func (*ListPublishedToursRequest) Descriptor() ([]byte, []int) {
	return file_tours_proto_rawDescGZIP(), []int{1}
}
func (x *ListPublishedToursRequest) GetAuthorization() string {
	if x != nil {
		return x.Authorization
	}
	return ""
}

type TourResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	TourJson string `protobuf:"bytes,1,opt,name=tour_json,json=tourJson,proto3" json:"tour_json,omitempty"`
}

func (x *TourResponse) Reset() {
	*x = TourResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_tours_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}
func (x *TourResponse) String() string { return protoimpl.X.MessageStringOf(x) }
func (*TourResponse) ProtoMessage()    {}
func (x *TourResponse) ProtoReflect() protoreflect.Message {
	mi := &file_tours_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}
func (*TourResponse) Descriptor() ([]byte, []int) { return file_tours_proto_rawDescGZIP(), []int{2} }
func (x *TourResponse) GetTourJson() string {
	if x != nil {
		return x.TourJson
	}
	return ""
}

type PublishedToursResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	ToursJson string `protobuf:"bytes,1,opt,name=tours_json,json=toursJson,proto3" json:"tours_json,omitempty"`
}

func (x *PublishedToursResponse) Reset() {
	*x = PublishedToursResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_tours_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}
func (x *PublishedToursResponse) String() string { return protoimpl.X.MessageStringOf(x) }
func (*PublishedToursResponse) ProtoMessage()    {}
func (x *PublishedToursResponse) ProtoReflect() protoreflect.Message {
	mi := &file_tours_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}
func (*PublishedToursResponse) Descriptor() ([]byte, []int) {
	return file_tours_proto_rawDescGZIP(), []int{3}
}
func (x *PublishedToursResponse) GetToursJson() string {
	if x != nil {
		return x.ToursJson
	}
	return ""
}

var File_tours_proto protoreflect.FileDescriptor

var file_tours_proto_rawDesc = []byte{
	0x0a, 0x0b, 0x74, 0x6f, 0x75, 0x72, 0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x05, 0x74,
	0x6f, 0x75, 0x72, 0x73, 0x22, 0x50, 0x0a, 0x12, 0x50, 0x75, 0x62, 0x6c, 0x69, 0x73, 0x68,
	0x54, 0x6f, 0x75, 0x72, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x17, 0x0a, 0x07,
	0x74, 0x6f, 0x75, 0x72, 0x5f, 0x69, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06,
	0x74, 0x6f, 0x75, 0x72, 0x49, 0x64, 0x12, 0x21, 0x0a, 0x0d, 0x61, 0x75, 0x74, 0x68, 0x6f,
	0x72, 0x69, 0x7a, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x0d, 0x61, 0x75, 0x74, 0x68, 0x6f, 0x72, 0x69, 0x7a, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x22,
	0x3c, 0x0a, 0x19, 0x4c, 0x69, 0x73, 0x74, 0x50, 0x75, 0x62, 0x6c, 0x69, 0x73, 0x68, 0x65,
	0x64, 0x54, 0x6f, 0x75, 0x72, 0x73, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x21,
	0x0a, 0x0d, 0x61, 0x75, 0x74, 0x68, 0x6f, 0x72, 0x69, 0x7a, 0x61, 0x74, 0x69, 0x6f, 0x6e,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0d, 0x61, 0x75, 0x74, 0x68, 0x6f, 0x72, 0x69,
	0x7a, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x22, 0x2d, 0x0a, 0x0c, 0x54, 0x6f, 0x75, 0x72, 0x52,
	0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x1d, 0x0a, 0x09, 0x74, 0x6f, 0x75, 0x72,
	0x5f, 0x6a, 0x73, 0x6f, 0x6e, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x74, 0x6f,
	0x75, 0x72, 0x4a, 0x73, 0x6f, 0x6e, 0x22, 0x38, 0x0a, 0x16, 0x50, 0x75, 0x62, 0x6c, 0x69,
	0x73, 0x68, 0x65, 0x64, 0x54, 0x6f, 0x75, 0x72, 0x73, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e,
	0x73, 0x65, 0x12, 0x1f, 0x0a, 0x0a, 0x74, 0x6f, 0x75, 0x72, 0x73, 0x5f, 0x6a, 0x73, 0x6f,
	0x6e, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x09, 0x74, 0x6f, 0x75, 0x72, 0x73, 0x4a,
	0x73, 0x6f, 0x6e, 0x32, 0x92, 0x01, 0x0a, 0x0c, 0x54, 0x6f, 0x75, 0x72, 0x73, 0x53, 0x65,
	0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x3e, 0x0a, 0x0b, 0x50, 0x75, 0x62, 0x6c, 0x69, 0x73,
	0x68, 0x54, 0x6f, 0x75, 0x72, 0x12, 0x19, 0x2e, 0x74, 0x6f, 0x75, 0x72, 0x73, 0x2e, 0x50,
	0x75, 0x62, 0x6c, 0x69, 0x73, 0x68, 0x54, 0x6f, 0x75, 0x72, 0x52, 0x65, 0x71, 0x75, 0x65,
	0x73, 0x74, 0x1a, 0x13, 0x2e, 0x74, 0x6f, 0x75, 0x72, 0x73, 0x2e, 0x54, 0x6f, 0x75, 0x72,
	0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x42, 0x0a, 0x12, 0x4c, 0x69, 0x73,
	0x74, 0x50, 0x75, 0x62, 0x6c, 0x69, 0x73, 0x68, 0x65, 0x64, 0x54, 0x6f, 0x75, 0x72, 0x73,
	0x12, 0x20, 0x2e, 0x74, 0x6f, 0x75, 0x72, 0x73, 0x2e, 0x4c, 0x69, 0x73, 0x74, 0x50, 0x75,
	0x62, 0x6c, 0x69, 0x73, 0x68, 0x65, 0x64, 0x54, 0x6f, 0x75, 0x72, 0x73, 0x52, 0x65, 0x71,
	0x75, 0x65, 0x73, 0x74, 0x1a, 0x1d, 0x2e, 0x74, 0x6f, 0x75, 0x72, 0x73, 0x2e, 0x50, 0x75,
	0x62, 0x6c, 0x69, 0x73, 0x68, 0x65, 0x64, 0x54, 0x6f, 0x75, 0x72, 0x73, 0x52, 0x65, 0x73,
	0x70, 0x6f, 0x6e, 0x73, 0x65, 0x42, 0x17, 0x5a, 0x15, 0x67, 0x61, 0x74, 0x65, 0x77, 0x61,
	0x79, 0x2f, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x2f, 0x74, 0x6f, 0x75, 0x72, 0x73, 0x70, 0x62,
	0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_tours_proto_rawDescOnce sync.Once
	file_tours_proto_rawDescData = file_tours_proto_rawDesc
)

func file_tours_proto_rawDescGZIP() []byte {
	file_tours_proto_rawDescOnce.Do(func() {
		file_tours_proto_rawDescData = protoimpl.X.CompressGZIP(file_tours_proto_rawDescData)
	})
	return file_tours_proto_rawDescData
}

var file_tours_proto_msgTypes = make([]protoimpl.MessageInfo, 4)
var file_tours_proto_goTypes = []interface{}{
	(*PublishTourRequest)(nil),
	(*ListPublishedToursRequest)(nil),
	(*TourResponse)(nil),
	(*PublishedToursResponse)(nil),
}

func init() { file_tours_proto_init() }
func file_tours_proto_init() {
	if File_tours_proto != nil {
		return
	}
	if protoimpl.UnsafeEnabled {
		file_tours_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*PublishTourRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_tours_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ListPublishedToursRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_tours_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*TourResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_tours_proto_msgTypes[3].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*PublishedToursResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_tours_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   4,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_tours_proto_goTypes,
		DependencyIndexes: nil,
		MessageInfos:      file_tours_proto_msgTypes,
	}.Build()
	File_tours_proto = out.File
	file_tours_proto_rawDesc = nil
	file_tours_proto_goTypes = nil
}
