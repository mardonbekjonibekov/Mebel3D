// Photos -> 3D model using Apple Object Capture (RealityKit PhotogrammetrySession).
// Runs locally on Apple Silicon Macs, free, no network.
// Usage: photogrammetry <imagesDir> <outputDir> [reduced|medium|full]
// Writes an OBJ (+ MTL + textures) into <outputDir> and prints JSON lines to stdout:
//   {"type":"progress","value":0.42}  {"type":"done"}  {"type":"error","message":"..."}

import Foundation
import RealityKit

func emit(_ dict: [String: Any]) {
    if let data = try? JSONSerialization.data(withJSONObject: dict),
       let line = String(data: data, encoding: .utf8) {
        print(line)
        fflush(stdout)
    }
}

let args = CommandLine.arguments
guard args.count >= 3 else {
    emit(["type": "error", "message": "usage: photogrammetry <imagesDir> <outputDir> [reduced|medium|full]"])
    exit(2)
}

guard PhotogrammetrySession.isSupported else {
    emit(["type": "error", "message": "Object Capture is not supported on this Mac"])
    exit(3)
}

let input = URL(fileURLWithPath: args[1], isDirectory: true)
let output = URL(fileURLWithPath: args[2], isDirectory: true)
let detail: PhotogrammetrySession.Request.Detail = {
    switch args.count > 3 ? args[3] : "reduced" {
    case "medium": return .medium
    case "full": return .full
    default: return .reduced
    }
}()

try? FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

var config = PhotogrammetrySession.Configuration()
config.isObjectMaskingEnabled = true
config.featureSensitivity = .high

let session: PhotogrammetrySession
do {
    session = try PhotogrammetrySession(input: input, configuration: config)
} catch {
    emit(["type": "error", "message": "Session could not start: \(error.localizedDescription)"])
    exit(4)
}

var boundsReceived = false

func startModel(bounds: BoundingBox?) {
    var request: PhotogrammetrySession.Request = .modelFile(url: output, detail: detail)
    if let b = bounds {
        // Pad the auto-detected object box a little so thin parts (legs, straps) are not clipped,
        // and extend it slightly below so the object's base is kept while distant ground is cut.
        let size = b.max - b.min
        let pad = SIMD3<Float>(size.x * 0.08, size.y * 0.05, size.z * 0.08)
        let cropped = BoundingBox(min: b.min - pad, max: b.max + pad)
        request = .modelFile(url: output, detail: detail, geometry: .init(bounds: cropped))
    }
    do {
        try session.process(requests: [request])
    } catch {
        emit(["type": "error", "message": "Processing failed: \(error.localizedDescription)"])
        exit(8)
    }
}

let task = Task {
    do {
        for try await message in session.outputs {
            switch message {
            case .requestProgress(let request, let fraction):
                if case .bounds = request {
                    emit(["type": "progress", "value": fraction * 0.3])
                } else {
                    emit(["type": "progress", "value": 0.3 + fraction * 0.7])
                }
            case .requestComplete(let request, let result):
                if case .bounds = request {
                    boundsReceived = true
                    if case .bounds(let box) = result {
                        emit(["type": "bounds", "min": [box.min.x, box.min.y, box.min.z], "max": [box.max.x, box.max.y, box.max.z]])
                        startModel(bounds: box)
                    } else {
                        startModel(bounds: nil)
                    }
                } else {
                    emit(["type": "done"])
                    exit(0)
                }
            case .requestError(let request, let error):
                if case .bounds = request {
                    emit(["type": "warning", "message": "Bounds failed, building uncropped: \(error.localizedDescription)"])
                    startModel(bounds: nil)
                } else {
                    emit(["type": "error", "message": error.localizedDescription])
                    exit(5)
                }
            case .invalidSample(let id, let reason):
                emit(["type": "warning", "message": "Sample \(id) skipped: \(reason)"])
            case .skippedSample(let id):
                emit(["type": "warning", "message": "Sample \(id) skipped"])
            case .processingCancelled:
                emit(["type": "error", "message": "Cancelled"])
                exit(6)
            default:
                break
            }
        }
    } catch {
        emit(["type": "error", "message": error.localizedDescription])
        exit(7)
    }
}

do {
    try session.process(requests: [.bounds])
} catch {
    emit(["type": "error", "message": "Processing failed: \(error.localizedDescription)"])
    exit(8)
}

RunLoop.main.run()
