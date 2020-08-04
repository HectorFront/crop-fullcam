import React from 'react';
import { fabric } from 'fabric';
import cam from './cam.jpeg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrop, faExpand } from '@fortawesome/free-solid-svg-icons';

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
    const resolutionFullscreenCam = [
      { x: 0, y: 0 },
      { x: this.resolutionCam.width, y: 0 },
      { x: this.resolutionCam.width, y: this.resolutionCam.height },
      { x: 0, y: this.resolutionCam.height }
    ];
    console.log('FullscreenCam', resolutionFullscreenCam);
  };

  onSubmitCropCam() {
    const newPointsCrop = this.state.pointsCropCam;
    console.log('Crop selecionado', newPointsCrop);
  }

  loadCanvas() {
    const canvas = new fabric.Canvas('crop');
    // pontos default para visualização
    const points = [
      { x: 20, y: 20 },
      { x: 780, y: 20 },
      { x: 780, y: 380 },
      { x: 20, y: 380 }
    ];
    // configurações do polígono com os pontos default acima
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

    const setPointsCrop = (defaultPoints) => {
      this.setState({ pointsCropCam: defaultPoints })
    }

    // retorna o desenho dos pontos default da handler do polígono 
    function polygonPositionHandler(d, f, fabricObject){
      const x = (fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x), y = (fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y);
      // verifica se cada ponto nao está passando do valor default da câmera nos eixos
      fabricObject.points.map(point=>{ 
        if(point.x > 806) point.x = 806;
        if(point.y > 406) point.y = 406;
        if(point.x < 0) point.x = 0;
        if(point.y < 0) point.y = 0;
      });
      // seta os pontos para submit
      setPointsCrop(fabricObject.points);
        
      return fabric.util.transformPoint({ x, y },
        fabric.util.multiplyTransformMatrices(fabricObject.canvas.viewportTransform, fabricObject.calcTransformMatrix())
      );
    }

    // retorna os pontos da movimentação do handler do polígono de acordo com o mouse 
    const actionHandler = (eventData, transform, x, y) => {
      const polygon = transform.target, currentControl = polygon.controls[polygon.__corner],
        mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(x, y), 'center', 'center'), polygonBaseSize = polygon._getNonTransformedDimensions(),
        size = polygon._getTransformedDimensions(0, 0),
        finalPointPosition = {
          x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
          y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
        };
      // não remover valor padrão de 0 para não crashar a funcionalidade
      polygon.points[!currentControl ? 0 : currentControl.pointIndex] = finalPointPosition;
      return true;
    }

    // transforma as matrizes dos eixos para a posição do handler
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

    // montando o desenho de crop de acordo com retorno das matrizes acima
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
      canvas.requestRenderAll(); // renderizando o desenho de crop para a visualização
      canvas.item(0).lockMovementY = true; // bloqueando movimento de arrastar do crop no eixo Y
      canvas.item(0).lockMovementX = true; // bloqueando movimento de arrastar do crop no eixo X
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
