package ossa

import "fmt"

// OSSAError is the base error type.
type OSSAError struct {
	Message string
	Cause   error
}

func (e *OSSAError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Cause)
	}
	return e.Message
}

func (e *OSSAError) Unwrap() error {
	return e.Cause
}

// NewError creates a new OSSAError.
func NewError(message string) *OSSAError {
	return &OSSAError{Message: message}
}

// WrapError wraps an error.
func WrapError(message string, cause error) *OSSAError {
	return &OSSAError{Message: message, Cause: cause}
}

// ValidationError represents a validation error.
type ValidationError struct {
	OSSAError
	Errors []string
}

// NewValidationError creates a new ValidationError.
func NewValidationError(errors []string) *ValidationError {
	return &ValidationError{
		OSSAError: OSSAError{Message: "validation failed"},
		Errors:    errors,
	}
}
