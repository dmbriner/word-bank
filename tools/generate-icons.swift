import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let iconDir = root.appendingPathComponent("icons", isDirectory: true)
let extensionIconDir = root.appendingPathComponent("extension/icons", isDirectory: true)

try FileManager.default.createDirectory(at: iconDir, withIntermediateDirectories: true)
try FileManager.default.createDirectory(at: extensionIconDir, withIntermediateDirectories: true)

let outputs: [(String, Int)] = [
  ("favicon.png", 512),
  ("apple-touch-icon.png", 180),
  ("icons/icon-192.png", 192),
  ("icons/icon-512.png", 512),
  ("extension/icons/icon16.png", 16),
  ("extension/icons/icon32.png", 32),
  ("extension/icons/icon48.png", 48),
  ("extension/icons/icon128.png", 128),
]

for (path, size) in outputs {
  try drawIcon(size: size, output: root.appendingPathComponent(path))
}

func drawIcon(size: Int, output: URL) throws {
  let canvas = CGFloat(size)
  let scale = canvas / 512
  guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: size,
    pixelsHigh: size,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  ) else {
    throw IconError.renderFailed
  }

  rep.size = NSSize(width: canvas, height: canvas)
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  NSGraphicsContext.current?.imageInterpolation = .high

  let full = NSRect(x: 0, y: 0, width: canvas, height: canvas)
  hex("4b2b35").setFill()
  NSBezierPath(rect: full).fill()

  hex("8b2f2d").setFill()
  NSBezierPath(rect: rect(0, 0, 512, 136, scale)).fill()

  hex("b87b2f").setFill()
  NSBezierPath(rect: rect(0, 376, 92, 136, scale)).fill()

  drawBook(scale: scale)
  drawMonogram(scale: scale)

  NSGraphicsContext.restoreGraphicsState()

  guard let data = rep.representation(using: .png, properties: [:]) else {
    throw IconError.renderFailed
  }

  try data.write(to: output)
}

func drawBook(scale: CGFloat) {
  hex("fffaf0").setFill()
  NSBezierPath(roundedRect: rect(86, 148, 340, 238, scale), xRadius: 34 * scale, yRadius: 34 * scale).fill()

  hex("efe2ce").setFill()
  NSBezierPath(rect: rect(252, 162, 8, 204, scale)).fill()

  hex("f7eddc").setFill()
  NSBezierPath(roundedRect: rect(107, 170, 136, 178, scale), xRadius: 18 * scale, yRadius: 18 * scale).fill()
  NSBezierPath(roundedRect: rect(269, 170, 136, 178, scale), xRadius: 18 * scale, yRadius: 18 * scale).fill()

  hex("ded0bd").setStroke()
  for offset in [0, 22, 44] {
    let y = CGFloat(220 + offset) * scale
    line(from: CGPoint(x: 126 * scale, y: y), to: CGPoint(x: 224 * scale, y: y), width: 4 * scale)
    line(from: CGPoint(x: 288 * scale, y: y), to: CGPoint(x: 386 * scale, y: y), width: 4 * scale)
  }

  hex("8b2f2d").setFill()
  let ribbon = NSBezierPath()
  ribbon.move(to: CGPoint(x: 347 * scale, y: 172 * scale))
  ribbon.line(to: CGPoint(x: 386 * scale, y: 172 * scale))
  ribbon.line(to: CGPoint(x: 386 * scale, y: 346 * scale))
  ribbon.line(to: CGPoint(x: 366 * scale, y: 322 * scale))
  ribbon.line(to: CGPoint(x: 347 * scale, y: 346 * scale))
  ribbon.close()
  ribbon.fill()
}

func drawMonogram(scale: CGFloat) {
  let font = NSFont(name: "Didot Bold", size: 150 * scale)
    ?? NSFont(name: "Georgia-Bold", size: 150 * scale)
    ?? NSFont.systemFont(ofSize: 150 * scale, weight: .bold)
  let attrs: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: hex("241f1a"),
  ]

  let letter = NSAttributedString(string: "D", attributes: attrs)
  let letterSize = letter.size()
  letter.draw(at: CGPoint(x: (256 * scale) - (letterSize.width / 2), y: 188 * scale))

  let smallFont = NSFont(name: "AvenirNextCondensed-Heavy", size: 42 * scale)
    ?? NSFont.systemFont(ofSize: 42 * scale, weight: .heavy)
  let smallAttrs: [NSAttributedString.Key: Any] = [
    .font: smallFont,
    .foregroundColor: hex("8b2f2d"),
    .kern: 1.4 * scale,
  ]
  let small = NSAttributedString(string: "WB", attributes: smallAttrs)
  let smallSize = small.size()
  small.draw(at: CGPoint(x: (256 * scale) - (smallSize.width / 2), y: 164 * scale))
}

func line(from: CGPoint, to: CGPoint, width: CGFloat) {
  let path = NSBezierPath()
  path.move(to: from)
  path.line(to: to)
  path.lineWidth = width
  path.lineCapStyle = .round
  path.stroke()
}

func rect(_ x: CGFloat, _ y: CGFloat, _ width: CGFloat, _ height: CGFloat, _ scale: CGFloat) -> NSRect {
  NSRect(x: x * scale, y: y * scale, width: width * scale, height: height * scale)
}

func hex(_ value: String, alpha: CGFloat = 1) -> NSColor {
  let scanner = Scanner(string: value)
  var hexValue: UInt64 = 0
  scanner.scanHexInt64(&hexValue)

  return NSColor(
    calibratedRed: CGFloat((hexValue >> 16) & 0xff) / 255,
    green: CGFloat((hexValue >> 8) & 0xff) / 255,
    blue: CGFloat(hexValue & 0xff) / 255,
    alpha: alpha
  )
}

enum IconError: Error {
  case renderFailed
}
