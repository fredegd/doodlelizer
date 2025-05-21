# Squigglify

![Squigglify](./public/favicon-32x32.png)

A powerful web-based tool to convert images into SVG vector graphics with customizable wave paths, perfect for pen plotters and digital art.

## Live Demo

Visit the live application at: [https://image2svg.vercel.app/](https://image2svg.vercel.app/)

## Overview

Squigglify transforms regular bitmap images into path-based SVG graphics using wave-like patterns. The application creates visually distinctive vector drawings that are optimized for pen plotters, CNC machines, and laser cutters, while also providing beautiful artistic renderings for digital and print media.

### Key Features

- **Image to SVG Conversion**: Transform any image into a vector SVG using wave-like paths
- **Curved Path Optimization**: Generate smooth, curved paths that optimize pen plotter efficiency and speed. Customize curvature for a more organic, hand-drawn appeal.
- **Random Image Starter**: Quickly begin with a random image sourced from Wikimedia Commons to spark your creativity.
- **Multiple Processing Modes**:
  - **Monochrome**: Single-color paths with density based on brightness
  - **Grayscale**: Multiple levels of gray for more detailed gradation
  - **Posterize**: Reduced color palette for stylized results
  - **CMYK (Beta)**: Separate paths for Cyan, Magenta, Yellow, and Black channels, ideal for multi-color plotting

## Use Cases

### Pen Plotting

The primary use case for Squigglify is generating SVG files for pen plotters. The curved path technology significantly improves plotting efficiency by:

- Reducing the number of pen lifts required
- Creating smoother, more continuous motion
- Optimizing travel paths between sections
- Supporting multi-color plotting through Posterization
- Supporting multi-color plotting through CMYK separation

### Other Applications

- **CNC Routing**: Produce toolpaths for custom machining
- **Digital Art**: Create unique artistic interpretations of photographs
- **Print Media**: Design distinctive line art illustrations
- **Laser Cutting/Engraving**: Generate patterns for material etching

## How to Use

1. **Upload an Image or Use a Random Starter**: Select any image file from your device, or use the random image loader to pick an inspiring image from Wikimedia Commons.
2. **Configure Settings**:
   - Choose a processing mode (Monochrome, Grayscale, Posterize, or CMYK)
   - Adjust grid density, curve parameters (for organic appeal), and other settings
   - Toggle continuous paths and curved paths options
3. **Preview & Refine**: See a real-time preview of your vector output
4. **Download**: Export the final SVG for use in plotting software or graphic design applications

## Processing Modes

### Monochrome

Converts your image to a single color with wave paths of varying density based on the brightness of the original image. Perfect for simple, one-color pen plots.

### Grayscale

Creates multiple layers of wave paths with different densities to represent different brightness levels in your image, resulting in a more detailed representation with depth.

### Posterize

Reduces your image to a limited color palette, creating separate path groups for each color level. Ideal for stylized, graphic representations.

### CMYK (Beta)

Separates your image into Cyan, Magenta, Yellow, and Black channels. Each channel can be toggled individually, making this perfect for multi-color plots where you want to change pens for each color layer. The black (K) channel often produces the best results for single-color plotting.

## Advanced Options

- **Curved Paths & Organic Styling**: Toggle between angular zigzags and smooth curved paths. Fine-tune curve parameters to achieve a more organic, hand-drawn look, potentially including shifted path effects.
- **Path Density**: Control the density of wave paths for each brightness level
- **Grid Size**: Adjust the number of rows and columns in the grid
- **Continuous Paths**: Generate unbroken, connected paths for more efficient plotting

## Technical Details

The application processes images in several steps:

1. **Image Analysis**: Breaks down the image into a grid of pixels
2. **Path Generation**: Creates wave paths based on pixel brightness/color
3. **Path Optimization**: Connects paths for continuous plotting when possible
4. **SVG Rendering**: Exports paths as standard SVG for maximum compatibility

## Development

This application is built with:

- Next.js for the React framework
- TypeScript for type safety
- Tailwind CSS for styling
- HTML Canvas API for image processing

## License

MIT License - Feel free to use, modify, and distribute this tool for personal or commercial projects.

## Credits

Created with ❤️ by [fedegd](https://github.com/fredegd/)

Feedback, suggestions, and contributions welcome!
