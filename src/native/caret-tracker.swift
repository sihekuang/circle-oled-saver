import Foundation
import ApplicationServices

struct CaretPosition: Codable {
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

struct CaretResult: Codable {
    let success: Bool
    let position: CaretPosition?
    let error: String?
}

func getCaretPosition() -> CaretResult {
    // Get the system-wide accessibility element
    let systemWide = AXUIElementCreateSystemWide()

    // Get the focused UI element
    var focusedElement: CFTypeRef?
    let focusError = AXUIElementCopyAttributeValue(
        systemWide,
        kAXFocusedUIElementAttribute as CFString,
        &focusedElement
    )

    guard focusError == .success, let element = focusedElement else {
        return CaretResult(success: false, position: nil, error: "No focused element")
    }

    let axElement = element as! AXUIElement

    // Get the selected text range (caret position is at selectedRange.location)
    var selectedRangeValue: CFTypeRef?
    let rangeError = AXUIElementCopyAttributeValue(
        axElement,
        kAXSelectedTextRangeAttribute as CFString,
        &selectedRangeValue
    )

    guard rangeError == .success, let rangeValue = selectedRangeValue else {
        return CaretResult(success: false, position: nil, error: "No text range available")
    }

    var selectedRange = CFRange()
    guard AXValueGetValue(rangeValue as! AXValue, .cfRange, &selectedRange) else {
        return CaretResult(success: false, position: nil, error: "Failed to get range value")
    }

    // Create a range at the caret position (length 0)
    var caretRange = CFRange(location: selectedRange.location, length: 0)
    guard let caretRangeValue = AXValueCreate(.cfRange, &caretRange) else {
        return CaretResult(success: false, position: nil, error: "Failed to create caret range")
    }

    // Get the bounds for the caret position
    var boundsValue: CFTypeRef?
    let boundsError = AXUIElementCopyParameterizedAttributeValue(
        axElement,
        kAXBoundsForRangeParameterizedAttribute as CFString,
        caretRangeValue,
        &boundsValue
    )

    guard boundsError == .success, let bounds = boundsValue else {
        return CaretResult(success: false, position: nil, error: "Failed to get bounds for caret")
    }

    var rect = CGRect()
    guard AXValueGetValue(bounds as! AXValue, .cgRect, &rect) else {
        return CaretResult(success: false, position: nil, error: "Failed to extract rect value")
    }

    let position = CaretPosition(
        x: Double(rect.origin.x),
        y: Double(rect.origin.y),
        width: Double(rect.size.width),
        height: Double(rect.size.height)
    )

    return CaretResult(success: true, position: position, error: nil)
}

// Check if we have accessibility permission
func checkAccessibilityPermission() -> Bool {
    let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: false] as CFDictionary
    return AXIsProcessTrustedWithOptions(options)
}

// Request accessibility permission (shows system dialog)
func requestAccessibilityPermission() -> Bool {
    let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
    return AXIsProcessTrustedWithOptions(options)
}

// Main entry point
func main() {
    let args = CommandLine.arguments

    if args.count > 1 {
        switch args[1] {
        case "check":
            // Check permission without prompting
            let hasPermission = checkAccessibilityPermission()
            print(hasPermission ? "authorized" : "denied")
            exit(0)
        case "request":
            // Request permission (shows dialog)
            let result = requestAccessibilityPermission()
            print(result ? "authorized" : "denied")
            exit(0)
        case "get":
            // Get caret position
            let result = getCaretPosition()
            let encoder = JSONEncoder()
            if let jsonData = try? encoder.encode(result),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                print(jsonString)
            } else {
                print("{\"success\":false,\"error\":\"JSON encoding failed\"}")
            }
            exit(0)
        default:
            break
        }
    }

    // Default: print usage
    print("Usage: caret-tracker <command>")
    print("Commands:")
    print("  check   - Check accessibility permission (no prompt)")
    print("  request - Request accessibility permission (shows dialog)")
    print("  get     - Get caret position as JSON")
    exit(1)
}

main()
