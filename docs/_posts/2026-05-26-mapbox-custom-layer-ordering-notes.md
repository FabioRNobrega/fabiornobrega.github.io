---
layout: post
title: "Keeping Route Previews Visible Above Mapbox Symbols"
date: 2026-05-26 10:00:00 -0300
categories: mapbox webgl
description: How to keep Mapbox route preview lines visible above dense symbol layers by replacing line layers with a 2D custom WebGL layer.
tags: mapbox webgl custom-layers routing maps
author: Fábio R. Nóbrega
continue: Continue reading
comments: false
read_time: Reading time
image: 2026-05-26-mapbox-custom-layer-ordering-notes.png
---

## The Problem

Route previews need to be easy to see while a user is creating or recalculating a route. In our case, the preview is a dashed route line with a white casing, plus start and destination pins. The user may also have many points of interest visible on the map, such as chargers, facilities, or other operational markers.

The desired behavior is simple:

- The dashed route preview line should remain visible above dense POI icons.
- The line should not flicker or disappear when the user zooms.
- The existing start and destination pins should keep using the same Mapbox symbol marker icons.
- The preview should still show, hide, clear, and recolor the same way it does today.

The problem showed up in Mapbox Standard globe rendering. The route preview was originally drawn with Mapbox `line` layers, and the route pins were drawn with a Mapbox `symbol` layer using the existing `pinSvg` and `destPinSvg` icons. The line layers used `line-elevation-reference: "ground"` and `line-z-offset` so the route could appear above POI icons.

That looked promising, but testing exposed a bad tradeoff: elevated lines disappeared around zoom level 6. Removing `line-z-offset` fixed the zoom visibility issue, but dense POI `symbol` layers could still visually cover the route line.

So the real requirement became: keep the route preview visible across zoom levels and visually above POI symbols, without changing the existing marker behavior and without forcing POIs away from Mapbox `symbol` layers.

Problem presentation:

<p class="codepen" data-theme-id="dark" data-height="300" data-pen-title="MapBox Symbol Hover Line Problem" data-default-tab="result" data-slug-hash="OPbxEqK" data-user="FabioRNobrega" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/FabioRNobrega/pen/OPbxEqK">
  MapBox Symbol Hover Line Problem</a> by Fábio R. Nóbrega 🏳️‍🌈🤖🎨 (<a href="https://codepen.io/FabioRNobrega">@FabioRNobrega</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

## Why This Doesn't Work Out of the Box with Mapbox

Mapbox style layers do not all render in one simple, flat stack. A normal layer list can make it look like one layer is above another, but the render pipeline can still treat different layer types differently.

That matters for this case because `line` layers and `symbol` layers are not always composited in the way the style order suggests, especially with globe rendering and draped ground-referenced geometry.

In practice, we saw two separate issues:

I. Elevated line layers were not stable across zoom levels.
   Adding `line-z-offset` helped the preview sit above symbols, but the route line disappeared around zoom 6 in globe rendering.

II. Ground-level line layers could still be covered by symbols.
   Removing `line-z-offset` made the line stable again, but POI `symbol` layers could still visually cover the route preview, even when layer ordering suggested the route should be above them.

This is the core limitation: Mapbox `line` and `symbol` layers can be rendered in different passes. When that happens, style-layer order alone is not enough to guarantee that a ground-referenced route line will visually sit above POI symbols.

We also tested a `3d` custom-layer approach using Mercator coordinates and the matrix passed to `render(gl, matrix)`. Under globe projection, that did not match Mapbox's own symbol placement. The custom geometry appeared offset from the ground position.

Switching to a `2d` custom layer and using `map.project()` fixed the projection mismatch:

```text
Helsinki custom pin | mapDevice=(377.60, 280.12) | custom2d=(377.60, 280.12) | deltaDevice=(0.00, 0.00)
Berlin custom pin | mapDevice=(27.51, 627.30) | custom2d=(27.51, 627.30) | deltaDevice=(0.00, 0.00)
Moscow custom pin | mapDevice=(726.13, 477.86) | custom2d=(726.13, 477.86) | deltaDevice=(0.00, 0.00)
```

That gave us the direction for the final approach: this route preview should be a 2D screen/map overlay, not a 3D terrain object.

## The Solution: Custom Layers

Mapbox custom layers let us draw directly with WebGL inside Mapbox's render loop. Instead of asking Mapbox's `line` layer renderer to draw the dashed preview line, we can draw the line ourselves.

For this use case, the custom layer should render only the route preview line:

- The white casing.
- The gray dashed inner line.
- The dash rhythm and dimensions that already exist in the route preview.

The route pins should remain Mapbox `symbol` layers. That keeps the existing `pinSvg`, `destPinSvg`, image loading, `icon-anchor: bottom`, and marker visibility behavior unchanged.

This approach avoids the specific `line` layer limitations while preserving the rest of the route preview API and user-visible behavior.

Solved version:

<p class="codepen" data-theme-id="dark" data-height="300" data-pen-title="Untitled" data-default-tab="result" data-slug-hash="yyVzEmg" data-user="FabioRNobrega" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/FabioRNobrega/pen/yyVzEmg">
  Untitled</a> by Fábio R. Nóbrega 🏳️‍🌈🤖🎨 (<a href="https://codepen.io/FabioRNobrega">@FabioRNobrega</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

The important technical choices are:

- Use a Mapbox `custom` layer.
- Use `renderingMode: '2d'`.
- Use `map.project(lngLat)` for point placement.
- Draw in screen/device pixel space.
- Request a repaint when route preview data changes.
- Keep diagnostic logs behind a debug flag or remove them once the feature is validated.

During debugging, we also learned something useful about custom layer ordering. A custom layer may exist at runtime even when it does not appear in `map.getStyle().layers`:

```text
mapGetLayerExists=true
mapGetLayerType=custom
mapGetLayerRenderingMode=2d
styleLayersContainsDashRoute=false
styleLayersDashRouteIndex=-1
```

Even though it was absent from the serialized style layer list, Mapbox could still move it:

```text
moveLayerResult=success
```

So `map.getLayer('dash-route')` is a better runtime existence check than searching only in `map.getStyle().layers`.

## How to Implement It

### 1. Keep the Existing Public API

The route preview already receives points through `RoutePreview.update(points)`. The custom renderer should consume that same points array without changing callers such as `route-form.js`.

The existing methods should keep working:

- `RoutePreview.update(points)`
- `RoutePreview.clear()`
- `RoutePreview.setHidden(true)`
- Theme-driven color updates
- Preview toggle behavior from `RouteForm.togglePreview(this)`

### 2. Replace the Route Line Layers

The existing Mapbox line layers should be replaced:

- `router-manager-preview-line-casing`
- `router-manager-preview-line`

The custom layer should draw both visual parts itself:

- casing width from `LINE_CASING_WIDTH`
- inner width from `LINE_WIDTH`
- dash length from `DASH_PX`
- gap length from `GAP_PX`

The custom layer should preserve the physical pixel rhythm of the old dashed preview.

### 3. Project Route Points with `map.project()`

For a 2D custom overlay, the reliable path is:

```js
const p = map.project(lngLat);
```

`map.project()` returns CSS pixels. WebGL drawing uses the canvas backing size, so convert CSS pixels to device pixels:

```js
const canvas = map.getCanvas();
const pixelRatioX = gl.canvas.width / canvas.clientWidth;
const pixelRatioY = gl.canvas.height / canvas.clientHeight;

const screenPoint = [
    p.x * pixelRatioX,
    p.y * pixelRatioY,
];
```

This keeps the custom line aligned with Mapbox's own symbol placement under globe projection.

### 4. Build the Dashed Geometry

The custom layer can generate triangles for each dash segment. For each route segment:

1. Measure the segment in screen pixels.
2. Walk along the segment using `DASH_PX + GAP_PX`.
3. Emit triangles only during the dash portions.
4. Draw the casing first.
5. Draw the inner line second.

The casing and inner line use the same dash/gap values so their dashes align visually.

### 5. Keep Pins as Symbols

The existing pins should remain Mapbox symbol layers:

```js
'icon-image': ['match', ['get', 'kind'], 'destination', 'pin-destination', 'pin-origin']
```

The icon layout should continue anchoring the pin tip to the coordinate:

```js
layout: {
    'icon-anchor': 'bottom',
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
}
```

That preserves the current marker behavior and avoids turning the marker migration into part of the line-rendering fix.

### 6. Handle Updates and Repaints

When preview points change, the custom layer should rebuild its buffers or cached geometry. It should not allocate fresh WebGL buffers every animation frame.

After a route update, request a repaint:

```js
map.triggerRepaint();
```

This is especially important during drag and reorder interactions, where users expect the preview line to update immediately.

### 7. Handle Style Reloads

Mapbox can recreate layers and WebGL resources when the map style changes. The custom layer should create shaders, programs, and buffers inside `onAdd(map, gl)` and release them in `onRemove(map, gl)`.

That keeps it compatible with style changes such as Standard and Standard Satellite.

### 8. Be Careful with Layer Diagnostics

When debugging custom layer order, do not rely only on:

```js
map.getStyle().layers
```

Use:

```js
map.getLayer('dash-route')
```

A useful diagnostic combination is:

```text
mapGetLayerExists=true
styleLayersContainsDashRoute=false
moveLayerResult=success
```

That means the custom layer exists in Mapbox's runtime layer registry, even if it is not visible in the serialized style layer list.

## Key Takeaways

- Mapbox `line` and `symbol` layers can render in different passes, especially with globe rendering.
- Style-layer order alone may not make a ground-referenced line appear above dense symbol layers.
- `line-z-offset` can make a line appear above symbols, but it can also introduce zoom-level visibility problems.
- A 2D custom WebGL layer is a good fit for a route preview overlay because it avoids the Mapbox `line` layer render-pass limitation.
- Use `map.project()` for 2D custom-layer placement under globe projection.
- Keep route pins as Mapbox symbols when the marker behavior is already correct.
- Use `map.getLayer()` to check custom layer presence.
- Do not rely only on `map.getStyle().layers` when debugging custom layers.
- Rebuild custom geometry only when points or colors change, not every frame.
- Remove or gate diagnostic logs before shipping the final feature.
