package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/go-chi/httplog/v2"
	"github.com/go-playground/validator/v10"
)

type ApiError struct {
	Status int    `json:"status"`
	Msg    string `json:"message"`
}

func (e *ApiError) Error() string {
	return e.Msg
}

type Handler func(w http.ResponseWriter, r *http.Request) error

type HandlerOptions struct {
	Log *httplog.Logger
}

// WrapHandler wraps a handler function and returns a http.HandlerFunc
// this allows for custom error handling and logging
func WrapHandler(fn Handler, log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := fn(w, r); err != nil {
			w.Header().Set("Content-Type", "application/json")
			if apiErr, ok := err.(*ApiError); ok {
				if apiErr.Status >= 500 {
					log.Error(apiErr.Error())
				} else {
					log.Debug(apiErr.Error())
				}
				w.WriteHeader(apiErr.Status)
				apiErrJSON, _ := json.Marshal(apiErr)
				w.Write(apiErrJSON)
			} else {
				log.Error(err.Error())
				// this needs ApiError to be returned
				w.WriteHeader(http.StatusInternalServerError)
				apiErr := &ApiError{
					Status: http.StatusInternalServerError,
					Msg:    "Internal Server Error",
				}
				apiErrJSON, _ := json.Marshal(apiErr)
				w.Write(apiErrJSON)
			}
		}
	}
}

func JsonResponse(w http.ResponseWriter, status int, data any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(data)
}

var validate = validator.New()

func DecodeJSONBody(r *http.Request, dst any) error {
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(dst); err != nil {
		return &ApiError{
			Status: http.StatusBadRequest,
			Msg:    fmt.Sprintf("Invalid request body: %v", err),
		}
	}
	err := validate.Struct(dst)
	if err != nil {
		var validateErrs validator.ValidationErrors
		if errors.As(err, &validateErrs) {
			apiErr := &ApiError{
				Status: http.StatusBadRequest,
				Msg:    fmt.Sprintf("Validation failed: %s", validateErrs.Error()),
			}
			return apiErr
		}
	}
	return nil
}
