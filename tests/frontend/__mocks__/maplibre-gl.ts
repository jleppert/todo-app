const EventEmitter = class {
  private listeners: Record<string, Function[]> = {};

  on(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
    return this;
  }

  off(event: string, fn: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== fn);
    }
    return this;
  }

  fire(event: string, data?: any) {
    (this.listeners[event] || []).forEach(fn => fn(data));
    return this;
  }
};

class MockMap extends EventEmitter {
  private container: HTMLElement | null = null;

  constructor(options: any = {}) {
    super();
    if (options.container) {
      this.container = typeof options.container === 'string'
        ? document.getElementById(options.container)
        : options.container;
    }
    // Fire load and styledata events asynchronously so component transitions to loaded state
    setTimeout(() => {
      this.fire('load');
      this.fire('styledata');
    }, 0);
  }

  getCenter() { return { lng: 0, lat: 0 }; }
  getZoom() { return 3; }
  getBearing() { return 0; }
  getPitch() { return 0; }
  getContainer() { return this.container; }
  isMoving() { return false; }
  setStyle() { return this; }
  setProjection() { return this; }
  jumpTo() { return this; }
  flyTo() { return this; }
  zoomTo() { return this; }
  resetNorthPitch() { return this; }
  remove() {}
  resize() {}
  addSource() {}
  removeSource() {}
  getSource() { return null; }
  addLayer() {}
  removeLayer() {}
  getLayer() { return null; }
  setLayoutProperty() {}
  setPaintProperty() {}
}

class MockMarker {
  private lngLat = { lng: 0, lat: 0 };
  private element = document.createElement('div');

  setLngLat(lngLat: [number, number]) {
    this.lngLat = { lng: lngLat[0], lat: lngLat[1] };
    return this;
  }
  getLngLat() { return this.lngLat; }
  getElement() { return this.element; }
  addTo() { return this; }
  remove() { return this; }
  setPopup() { return this; }
  setDraggable() { return this; }
  isDraggable() { return false; }
  getOffset() { return { x: 0, y: 0 }; }
  setOffset() { return this; }
  getRotation() { return 0; }
  setRotation() { return this; }
  getRotationAlignment() { return 'auto'; }
  setRotationAlignment() { return this; }
  getPitchAlignment() { return 'auto'; }
  setPitchAlignment() { return this; }
  on() { return this; }
  off() { return this; }
}

class MockPopup {
  setLngLat() { return this; }
  setHTML() { return this; }
  setDOMContent() { return this; }
  setMaxWidth() { return this; }
  setOffset() { return this; }
  addTo() { return this; }
  remove() { return this; }
  isOpen() { return false; }
  on() { return this; }
  off() { return this; }
}

const maplibregl = {
  Map: MockMap,
  Marker: MockMarker,
  Popup: MockPopup,
};

export default maplibregl;
export { MockMap as Map, MockMarker as Marker, MockPopup as Popup };
