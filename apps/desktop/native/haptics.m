#import <AppKit/AppKit.h>

// Node-API is resolved from the host process at load time (-undefined dynamic_lookup),
// and its ABI is stable, so the handful of calls used are declared here instead of
// pulling in Node headers.
typedef struct napi_env__ *napi_env;
typedef struct napi_value__ *napi_value;
typedef struct napi_callback_info__ *napi_callback_info;
typedef int napi_status;
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);

extern napi_status napi_get_cb_info(napi_env env, napi_callback_info info, size_t *argc,
                                    napi_value *argv, napi_value *this_arg, void **data);
extern napi_status napi_get_value_int32(napi_env env, napi_value value, int32_t *result);
extern napi_status napi_create_function(napi_env env, const char *name, size_t length,
                                        napi_callback cb, void *data, napi_value *result);
extern napi_status napi_set_named_property(napi_env env, napi_value object, const char *name,
                                           napi_value value);

static napi_value perform(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  int32_t pattern = NSHapticFeedbackPatternGeneric;
  if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) == 0 && argc > 0) {
    napi_get_value_int32(env, argv[0], &pattern);
  }
  [[NSHapticFeedbackManager defaultPerformer]
      performFeedbackPattern:(NSHapticFeedbackPattern)pattern
             performanceTime:NSHapticFeedbackPerformanceTimeNow];
  return NULL;
}

__attribute__((visibility("default"))) napi_value napi_register_module_v1(napi_env env,
                                                                           napi_value exports) {
  napi_value fn;
  if (napi_create_function(env, "perform", SIZE_MAX, perform, NULL, &fn) == 0) {
    napi_set_named_property(env, exports, "perform", fn);
  }
  return exports;
}
