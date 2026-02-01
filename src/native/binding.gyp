{
  "targets": [
    {
      "target_name": "caret_tracker",
      "sources": ["caret_tracker.mm"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15",
            "OTHER_CFLAGS": ["-ObjC++"],
            "OTHER_LDFLAGS": [
              "-framework", "ApplicationServices",
              "-framework", "Foundation",
              "-framework", "AppKit"
            ]
          }
        }]
      ]
    }
  ]
}
