package main

import (
	"context"
	"fmt"
	"sync"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/reflect/protodesc"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/descriptorpb"
	"google.golang.org/protobuf/types/dynamicpb"
	"google.golang.org/protobuf/proto"
)

type authRegisterResult struct {
	Message  string
	UserJSON string
}

type authLoginResult struct {
	Message  string
	Token    string
	UserJSON string
}

type authRPCClient struct {
	conn grpc.ClientConnInterface

	once sync.Once
	initErr error

	registerRequestDesc protoreflect.MessageDescriptor
	registerResponseDesc protoreflect.MessageDescriptor
	loginRequestDesc protoreflect.MessageDescriptor
	loginResponseDesc protoreflect.MessageDescriptor
}

func newAuthRPCClient(conn grpc.ClientConnInterface) (*authRPCClient, error) {
	client := &authRPCClient{conn: conn}
	client.ensureInitialized()
	return client, client.initErr
}

func (c *authRPCClient) ensureInitialized() {
	c.once.Do(func() {
		fileDesc, err := buildAuthFileDescriptor()
		if err != nil {
			c.initErr = err
			return
		}

		messages := fileDesc.Messages()
		c.registerRequestDesc = messages.ByName("RegisterRequest")
		c.registerResponseDesc = messages.ByName("RegisterResponse")
		c.loginRequestDesc = messages.ByName("LoginRequest")
		c.loginResponseDesc = messages.ByName("LoginResponse")

		if c.registerRequestDesc == nil || c.registerResponseDesc == nil || c.loginRequestDesc == nil || c.loginResponseDesc == nil {
			c.initErr = fmt.Errorf("failed to load auth rpc message descriptors")
		}
	})
}

func (c *authRPCClient) Register(ctx context.Context, username, email, password, role string) (authRegisterResult, error) {
	c.ensureInitialized()
	if c.initErr != nil {
		return authRegisterResult{}, c.initErr
	}

	req := dynamicpb.NewMessage(c.registerRequestDesc)
	setDynamicString(req, "username", username)
	setDynamicString(req, "email", email)
	setDynamicString(req, "password", password)
	setDynamicString(req, "role", role)

	resp := dynamicpb.NewMessage(c.registerResponseDesc)
	if err := c.conn.Invoke(ctx, "/auth.AuthService/Register", req, resp); err != nil {
		return authRegisterResult{}, err
	}

	return authRegisterResult{
		Message:  getDynamicString(resp, "message"),
		UserJSON: getDynamicString(resp, "user_json"),
	}, nil
}

func (c *authRPCClient) Login(ctx context.Context, email, password string) (authLoginResult, error) {
	c.ensureInitialized()
	if c.initErr != nil {
		return authLoginResult{}, c.initErr
	}

	req := dynamicpb.NewMessage(c.loginRequestDesc)
	setDynamicString(req, "email", email)
	setDynamicString(req, "password", password)

	resp := dynamicpb.NewMessage(c.loginResponseDesc)
	if err := c.conn.Invoke(ctx, "/auth.AuthService/Login", req, resp); err != nil {
		return authLoginResult{}, err
	}

	return authLoginResult{
		Message:  getDynamicString(resp, "message"),
		Token:    getDynamicString(resp, "token"),
		UserJSON: getDynamicString(resp, "user_json"),
	}, nil
}

func setDynamicString(msg *dynamicpb.Message, fieldName string, value string) {
	field := msg.Descriptor().Fields().ByName(protoreflect.Name(fieldName))
	if field == nil {
		return
	}
	msg.Set(field, protoreflect.ValueOfString(value))
}

func getDynamicString(msg *dynamicpb.Message, fieldName string) string {
	field := msg.Descriptor().Fields().ByName(protoreflect.Name(fieldName))
	if field == nil {
		return ""
	}
	return msg.Get(field).String()
}

func buildAuthFileDescriptor() (protoreflect.FileDescriptor, error) {
	fd := &descriptorpb.FileDescriptorProto{
		Syntax:  proto.String("proto3"),
		Name:    proto.String("auth.proto"),
		Package: proto.String("auth"),
		MessageType: []*descriptorpb.DescriptorProto{
			{
				Name: proto.String("RegisterRequest"),
				Field: []*descriptorpb.FieldDescriptorProto{
					{Name: proto.String("username"), Number: proto.Int32(1), Label: descriptorpb.FieldDescriptorProto_LABEL_OPTIONAL.Enum(), Type: descriptorpb.FieldDescriptorProto_TYPE_STRING.Enum()},
					{Name: proto.String("email"), Number: proto.Int32(2), Label: descriptorpb.FieldDescriptorProto_LABEL_OPTIONAL.Enum(), Type: descriptorpb.FieldDescriptorProto_TYPE_STRING.Enum()},
					{Name: proto.String("password"), Number: proto.Int32(3), Label: descriptorpb.FieldDescriptorProto_LABEL_OPTIONAL.Enum(), Type: descriptorpb.FieldDescriptorProto_TYPE_STRING.Enum()},
					{Name: proto.String("role"), Number: proto.Int32(4), Label: descriptorpb.FieldDescriptorProto_LABEL_OPTIONAL.Enum(), Type: descriptorpb.FieldDescriptorProto_TYPE_STRING.Enum()},
				},
			},
			{
				Name: proto.String("RegisterResponse"),
				Field: []*descriptorpb.FieldDescriptorProto{
					{Name: proto.String("message"), Number: proto.Int32(1), Label: descriptorpb.FieldDescriptorProto_LABEL_OPTIONAL.Enum(), Type: descriptorpb.FieldDescriptorProto_TYPE_STRING.Enum()},
					{Name: proto.String("user_json"), Number: proto.Int32(2), Label: descriptorpb.FieldDescriptorProto_LABEL_OPTIONAL.Enum(), Type: descriptorpb.FieldDescriptorProto_TYPE_STRING.Enum()},
				},
			},
			{
				Name: proto.String("LoginRequest"),
				Field: []*descriptorpb.FieldDescriptorProto{
					{Name: proto.String("email"), Number: proto.Int32(1), Label: descriptorpb.FieldDescriptorProto_LABEL_OPTIONAL.Enum(), Type: descriptorpb.FieldDescriptorProto_TYPE_STRING.Enum()},
					{Name: proto.String("password"), Number: proto.Int32(2), Label: descriptorpb.FieldDescriptorProto_LABEL_OPTIONAL.Enum(), Type: descriptorpb.FieldDescriptorProto_TYPE_STRING.Enum()},
				},
			},
			{
				Name: proto.String("LoginResponse"),
				Field: []*descriptorpb.FieldDescriptorProto{
					{Name: proto.String("message"), Number: proto.Int32(1), Label: descriptorpb.FieldDescriptorProto_LABEL_OPTIONAL.Enum(), Type: descriptorpb.FieldDescriptorProto_TYPE_STRING.Enum()},
					{Name: proto.String("token"), Number: proto.Int32(2), Label: descriptorpb.FieldDescriptorProto_LABEL_OPTIONAL.Enum(), Type: descriptorpb.FieldDescriptorProto_TYPE_STRING.Enum()},
					{Name: proto.String("user_json"), Number: proto.Int32(3), Label: descriptorpb.FieldDescriptorProto_LABEL_OPTIONAL.Enum(), Type: descriptorpb.FieldDescriptorProto_TYPE_STRING.Enum()},
				},
			},
		},
		Service: []*descriptorpb.ServiceDescriptorProto{
			{
				Name: proto.String("AuthService"),
				Method: []*descriptorpb.MethodDescriptorProto{
					{Name: proto.String("Register"), InputType: proto.String(".auth.RegisterRequest"), OutputType: proto.String(".auth.RegisterResponse")},
					{Name: proto.String("Login"), InputType: proto.String(".auth.LoginRequest"), OutputType: proto.String(".auth.LoginResponse")},
				},
			},
		},
	}

	return protodesc.NewFile(fd, nil)
}
