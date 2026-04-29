#import <Foundation/Foundation.h>
#import <ApplicationServices/ApplicationServices.h>
#import <AppKit/AppKit.h>
#include <napi.h>

// Get the caret position from the focused UI element
Napi::Value GetCaretPosition(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // Get the system-wide accessibility element
    AXUIElementRef systemWide = AXUIElementCreateSystemWide();
    if (!systemWide) {
        return env.Null();
    }

    // First check if we have accessibility permission
    Boolean isTrusted = AXIsProcessTrusted();
    if (!isTrusted) {
        NSLog(@"[CaretTracker] Accessibility permission not granted");
        return env.Null();
    }

    // Get the focused application
    AXUIElementRef focusedApp = NULL;
    AXError appError = AXUIElementCopyAttributeValue(
        systemWide,
        kAXFocusedApplicationAttribute,
        (CFTypeRef*)&focusedApp
    );
    CFRelease(systemWide);

    if (appError != kAXErrorSuccess || !focusedApp) {
        // -25212 = kAXErrorNoValue - no focused app at this moment (transient)
        // Only log if it's not the common "no value" case
        if (appError != -25212) {
            NSLog(@"[CaretTracker] No focused app, error: %d", appError);
        }
        return env.Null();
    }

    // Get the focused UI element within the app
    AXUIElementRef focusedElement = NULL;
    AXError elemError = AXUIElementCopyAttributeValue(
        focusedApp,
        kAXFocusedUIElementAttribute,
        (CFTypeRef*)&focusedElement
    );
    CFRelease(focusedApp);

    if (elemError != kAXErrorSuccess || !focusedElement) {
        NSLog(@"[CaretTracker] No focused element, error: %d", elemError);
        return env.Null();
    }

    // Get the selected text range (caret position)
    CFTypeRef selectedRangeValue = NULL;
    AXError rangeError = AXUIElementCopyAttributeValue(
        focusedElement,
        kAXSelectedTextRangeAttribute,
        &selectedRangeValue
    );

    if (rangeError != kAXErrorSuccess || !selectedRangeValue) {
        CFRelease(focusedElement);
        // Not a text element, that's OK
        return env.Null();
    }

    CFRange selectedRange;
    if (!AXValueGetValue((AXValueRef)selectedRangeValue, kAXValueTypeCFRange, &selectedRange)) {
        CFRelease(selectedRangeValue);
        CFRelease(focusedElement);
        return env.Null();
    }
    CFRelease(selectedRangeValue);

    // Create a range at the caret position (length 0)
    CFRange caretRange = CFRangeMake(selectedRange.location, 0);
    AXValueRef caretRangeValue = AXValueCreate(kAXValueTypeCFRange, &caretRange);
    if (!caretRangeValue) {
        CFRelease(focusedElement);
        return env.Null();
    }

    // Get the bounds for the caret position
    CFTypeRef boundsValue = NULL;
    AXError boundsError = AXUIElementCopyParameterizedAttributeValue(
        focusedElement,
        kAXBoundsForRangeParameterizedAttribute,
        caretRangeValue,
        &boundsValue
    );
    CFRelease(caretRangeValue);
    CFRelease(focusedElement);

    if (boundsError != kAXErrorSuccess || !boundsValue) {
        NSLog(@"[CaretTracker] Cannot get bounds, error: %d", boundsError);
        return env.Null();
    }

    CGRect bounds;
    if (!AXValueGetValue((AXValueRef)boundsValue, kAXValueTypeCGRect, &bounds)) {
        CFRelease(boundsValue);
        return env.Null();
    }
    CFRelease(boundsValue);

    // Return the caret position as an object
    Napi::Object result = Napi::Object::New(env);
    result.Set("x", Napi::Number::New(env, bounds.origin.x));
    result.Set("y", Napi::Number::New(env, bounds.origin.y));
    result.Set("width", Napi::Number::New(env, bounds.size.width));
    result.Set("height", Napi::Number::New(env, bounds.size.height));

    return result;
}

// Check if accessibility is enabled
Napi::Value CheckAccessibility(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    Boolean isTrusted = AXIsProcessTrusted();
    return Napi::Boolean::New(env, isTrusted);
}

// Initialize the module
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getCaretPosition", Napi::Function::New(env, GetCaretPosition));
    exports.Set("checkAccessibility", Napi::Function::New(env, CheckAccessibility));
    return exports;
}

NODE_API_MODULE(caret_tracker, Init)
