export function cameraFrame(width:number,height:number,videoWidth:number,videoHeight:number){
 if(![width,height,videoWidth,videoHeight].every(n=>Number.isFinite(n)&&n>0))return null;
 const scale=Math.min(width/videoWidth,height/videoHeight);
 return {width:videoWidth*scale,height:videoHeight*scale,left:(width-videoWidth*scale)/2,top:(height-videoHeight*scale)/2};
}
