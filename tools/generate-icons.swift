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
  NSGraphicsContext.current?.shouldAntialias = true

  drawBook(scale: scale)
  drawMonogram(scale: scale)

  NSGraphicsContext.restoreGraphicsState()

  guard let data = rep.representation(using: .png, properties: [:]) else {
    throw IconError.renderFailed
  }

  try data.write(to: output)
}

func drawBook(scale: CGFloat) {
  let full = rect(0, 0, 512, 512, scale)
  hex("ffffff").setFill()
  NSBezierPath(rect: full).fill()

  let cover = NSBezierPath(roundedRect: rect(24, 24, 464, 464, scale), xRadius: 82 * scale, yRadius: 82 * scale)
  NSGraphicsContext.saveGraphicsState()
  let shadow = NSShadow()
  shadow.shadowColor = hex("9b7f5e", alpha: 0.14)
  shadow.shadowOffset = NSSize(width: 0, height: -5 * scale)
  shadow.shadowBlurRadius = 11 * scale
  shadow.set()

  let coverGradient = NSGradient(colors: [
    hex("ffffff"),
    hex("fffefd"),
    hex("fff9ef"),
  ])!
  coverGradient.draw(in: cover, angle: 90)
  NSGraphicsContext.restoreGraphicsState()

  hex("e4d7c5").setStroke()
  cover.lineWidth = 5 * scale
  cover.stroke()

  hex("efe3d2").setStroke()
  let inset = NSBezierPath(roundedRect: rect(48, 48, 416, 416, scale), xRadius: 58 * scale, yRadius: 58 * scale)
  inset.lineWidth = 2 * scale
  inset.stroke()

  hex("eadfcf", alpha: 0.95).setStroke()
  line(from: CGPoint(x: 104 * scale, y: 118 * scale), to: CGPoint(x: 350 * scale, y: 118 * scale), width: 3 * scale)
  line(from: CGPoint(x: 104 * scale, y: 394 * scale), to: CGPoint(x: 350 * scale, y: 394 * scale), width: 3 * scale)

  hex("e8dac7").setStroke()
  line(from: CGPoint(x: 104 * scale, y: 238 * scale), to: CGPoint(x: 346 * scale, y: 238 * scale), width: 4 * scale)
  line(from: CGPoint(x: 104 * scale, y: 212 * scale), to: CGPoint(x: 330 * scale, y: 212 * scale), width: 4 * scale)

  hex("a7433d").setFill()
  let ribbon = NSBezierPath()
  ribbon.move(to: CGPoint(x: 376 * scale, y: 88 * scale))
  ribbon.line(to: CGPoint(x: 426 * scale, y: 88 * scale))
  ribbon.line(to: CGPoint(x: 426 * scale, y: 416 * scale))
  ribbon.line(to: CGPoint(x: 401 * scale, y: 380 * scale))
  ribbon.line(to: CGPoint(x: 376 * scale, y: 416 * scale))
  ribbon.close()
  ribbon.fill()

  hex("d0a252", alpha: 0.9).setFill()
  NSBezierPath(roundedRect: rect(376, 88, 50, 9, scale), xRadius: 4.5 * scale, yRadius: 4.5 * scale).fill()
}

func drawMonogram(scale: CGFloat) {
  let font = NSFont(name: "Didot Bold", size: 212 * scale)
    ?? NSFont(name: "Bodoni 72 Smallcaps Book", size: 212 * scale)
    ?? NSFont(name: "Georgia-Bold", size: 212 * scale)
    ?? NSFont.systemFont(ofSize: 212 * scale, weight: .bold)
  let attrs: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: hex("231d19"),
  ]

  let letter = NSAttributedString(string: "D", attributes: attrs)
  let letterSize = letter.size()
  letter.draw(at: CGPoint(x: (234 * scale) - (letterSize.width / 2), y: 160 * scale))

  hex("c99a49").setFill()
  NSBezierPath(roundedRect: rect(186, 156, 96, 8, scale), xRadius: 4 * scale, yRadius: 4 * scale).fill()
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
