import React, { forwardRef, useImperativeHandle } from "react";
import { View } from "react-native";

const noop = () => {};

export const MapView = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    animateCamera: noop,
    fitToCoordinates: noop,
  }));
  return <View style={props.style}>{props.children}</View>;
});

const MarkerStub = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    animateMarkerToCoordinate: noop,
  }));
  return null;
});

export const Marker = Object.assign(MarkerStub, { Animated: MarkerStub });
export const Polyline = () => null;

export class AnimatedRegion {}
