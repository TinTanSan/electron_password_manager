import React, { useEffect, useRef, useState } from 'react'

export default function Slider({minimum, maximum, selectedHeight="h-6", bgStyle="bg-base-100 h-4", thumbDimensions="h-6 w-6", className="", roundTo=0}:{minimum:number, maximum:number , bgStyle?:string, selectedHeight?:string,thumbDimensions?:string, className?:string, roundTo?:number}) {
    const [position, setPosition] = useState(maximum);
    const sliderRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const [value, setValue] = useState(minimum);
    const thumbXSize = Number(thumbDimensions.substring(thumbDimensions.indexOf("w-")+2,thumbDimensions.indexOf("w-")+3))*4;
    
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // If clicking directly on the track, move handle immediately
        if (e.target === sliderRef.current) {
            const clampedX = Math.max(8 / 2, Math.min(x, rect.width -( thumbXSize ) / 2));
            setPosition(clampedX);
        }
        isDragging.current = true;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
    
        if (!isDragging.current || !sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left; // mouse position relative to slider
        const clampedX = Math.max(minimum, Math.min(x, rect.width - thumbXSize / 2));
        setPosition(clampedX);
    };

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);
    useEffect(()=>{
        if (!sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const range = maximum - minimum;

        // normalize position → value
        const normalized =
            minimum +
            ((position - thumbXSize / 2) / (rect.width - thumbXSize)) * range;

        setValue(Number(normalized.toFixed(roundTo)));
    } ,[position, minimum, maximum, thumbXSize])
    
    const setPos = (value: number)=>{
        const rect = sliderRef.current.getBoundingClientRect();
        const range = maximum - minimum;
        const pos = ((value - minimum) / range) * (rect.width - thumbXSize) +
        thumbXSize / 2;
        setPosition(pos);
    }
  
  return (
    <div  onMouseDown={handleMouseDown}  id='slider' ref={sliderRef} className={`relative flex w-60 h-6 rounded-full items-center ${className}`}>
        <div  className={`flex w-full absolute bg-base-100 pointer-events-none ${bgStyle}`} />
        {/* Track (fill to current position) */}
        <div  className={`flex absolute rounded-l-full left-0 ${selectedHeight} bg-neutral transition-none pointer-events-none"`} style={{ width: `${position+(thumbXSize*0.15)}px` }} />
        {/* Draggable handle */}
        <div onMouseDown={(e) => {e.stopPropagation(); handleMouseDown(e);}}  className={`absolute ${thumbDimensions} bg-base-100 border-4 border-neutral rounded-full cursor-pointer `} style={{ left: `${position - 8}px` }} />
        <input type='number' value={value} defaultValue={minimum} className='flex w-10 border-2 z-10 absolute -right-10 h-full' onChange={(e)=>{setPos(Number(e.target.value)); setValue(Number(e.target.value));}} />
    </div>
  )
}
