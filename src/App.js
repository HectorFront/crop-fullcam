import React from 'react';
import { fabric } from 'fabric';
import cam from './cam.jpeg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrop, faExpand } from '@fortawesome/free-solid-svg-icons'

import './App.css';

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      pointsCropCam: []
    }
    this.resolutionCam = { width: 806, height: 406 }
    this.colorCrop = 'rgba(47, 175, 255, 0.58)';
  }

  onFullscreenCam() {
    const resolutionFullscreenCam = [{ x: 0, y: 0 }, { x: 806, y: 0 }, { x: 806, y: 406 }, { x: 0, y: 406 }];
    console.log('FullscreenCam', resolutionFullscreenCam);
  };

  onSubmitCropCam() {
    let newPointsCrop = this.state.pointsCropCam;
    newPointsCrop.forEach(point => {
      if (point.x < 0) point.x = 0;
      if (point.y < 0) point.y = 0;
    })
    console.log('Crop', newPointsCrop);
  }

  loadCanvas() {
    const canvas = new fabric.Canvas('crop');
    const points = [
      { x: 20, y: 20 },
      { x: 780, y: 20 },
      { x: 780, y: 380 },
      { x: 20, y: 380 }
    ];

    const polygon = new fabric.Polygon(points, {
      scaleX: 1,
      scaleY: 1,
      strokeWidth: 1,
      stroke: this.colorCrop,
      objectCaching: false,
      transparentCorners: false,
      cornerColor: this.colorCrop,
      fill: this.colorCrop,
    });
    canvas.add(polygon);

    const setDefaultPoints = (defaultPoints) => {
      this.setState({ pointsCropCam: defaultPoints })
    }

    function polygonPositionHandler(d, f, fabricObject) {
      const x = (fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x), y = (fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y);
      setDefaultPoints(fabricObject.points);

      return fabric.util.transformPoint({ x, y },
        fabric.util.multiplyTransformMatrices(fabricObject.canvas.viewportTransform, fabricObject.calcTransformMatrix())
      );
    }

    const actionHandler = (eventData, transform, x, y) => {
      const polygon = transform.target, currentControl = polygon.controls[polygon.__corner],
        mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(x, y), 'center', 'center'), polygonBaseSize = polygon._getNonTransformedDimensions(),
        size = polygon._getTransformedDimensions(0, 0),
        finalPointPosition = {
          x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
          y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
        };
      this.setState({ pointsCropCam: polygon.points })
      // aponta um limite do eixo x da diretira e y do ponto que estou mexendo 
      if (finalPointPosition.x > this.resolutionCam.width) finalPointPosition.x = this.resolutionCam.width;
      if (finalPointPosition.y > this.resolutionCam.height) finalPointPosition.y = this.resolutionCam.height;
      polygon.points[!currentControl ? 0 : currentControl.pointIndex] = finalPointPosition;

      return true;
    }

    const anchorWrapper = (anchorIndex, fn) => {
      return (eventData, transform, x, y) => {
        let fabricObject = transform.target, absolutePoint = fabric.util.transformPoint({
          x: (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x),
          y: (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y),
        }, fabricObject.calcTransformMatrix()), actionPerformed = fn(eventData, transform, x, y), polygonBaseSize = fabricObject._getNonTransformedDimensions(),

          newX = (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) / polygonBaseSize.x,
          newY = (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) / polygonBaseSize.y;
        fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);

        return actionPerformed;
      }
    }

    const poly = canvas.getObjects()[0];
    canvas.setActiveObject(poly);
    const lastControl = poly.points.length - 1;
    poly.cornerStyle = 'circle';
    poly.cornerColor = 'rgb(47, 177, 255)';
    poly.controls = poly.points.reduce((acc, point, index) => {
      acc[`p${index}`] = new fabric.Control({
        positionHandler: polygonPositionHandler,
        actionHandler: anchorWrapper(index > 0 ? index - 1 : lastControl, actionHandler),
        actionName: 'modifyPolygon',
        pointIndex: index
      });
      return acc;
    }, {});
    canvas.requestRenderAll();
    canvas.item(0).lockMovementY = true;
    canvas.item(0).lockMovementX = true;
  }

  componentDidMount() {
    this.loadCanvas();
  }

  render() {
    return (
      <>
        <div>
          <img src={cam} width={this.resolutionCam.width} height={this.resolutionCam.height} alt="cam" />
          <canvas id="crop" width={this.resolutionCam.width} height={this.resolutionCam.height}></canvas>
        </div>

        <button
          title={'Capturar toda área'}
          onClick={this.onFullscreenCam.bind(this)} style={{ backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', outline: 'none', padding: 8, marginRight: 10, borderRadius: 4 }}>
          <FontAwesomeIcon icon={faExpand} style={{ color: '#fff' }} />
        </button>

        <button
          title={'Salvar área selecionada'}
          onClick={this.onSubmitCropCam.bind(this)} style={{ backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', outline: 'none', padding: 8, borderRadius: 4 }}>
          <FontAwesomeIcon icon={faCrop} style={{ color: '#fff' }} />
        </button>
      </>
    );
  }
}

export default App;
