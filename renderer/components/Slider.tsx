import React, { useEffect, useRef, useState } from 'react'

export default function Slider({value, setValue, minimum, maximum, selectedHeight="h-6", bgStyle="bg-base-100 h-4", thumbDimensions="h-6 w-6 border-4", className="", roundTo=0}:{ value:number, setValue:React.Dispatch<React.SetStateAction<number>>,minimum:number, maximum:number , bgStyle?:string, selectedHeight?:string,thumbDimensions?:string, className?:string, roundTo?:number}) {
    const [position, setPosition] = useState(maximum);
    const sliderRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
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
        setV(Number(normalized.toFixed(roundTo)));
        setValue(Number(normalized.toFixed(roundTo)))
    } ,[position, minimum, maximum, thumbXSize])
    

    const handleValueChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
        let length = parseInt(e.target.value);
        setV(length);
        if (!Number.isNaN(length)){
            if (length < minimum){
                length = minimum;
            }
            else if (length > maximum){
                length = maximum;
                
            }else{
                setValue(length); 
            } 
            console.log('changing val')
            setPos(length);
        }
        
    }

    const [v, setV] = useState(minimum);


    const setPos = (value: number)=>{
        const rect = sliderRef.current.getBoundingClientRect();
        const range = maximum - minimum;
        const pos = ((value - minimum) / range) * (rect.width - thumbXSize) +
        thumbXSize / 2;
        setPosition(pos);
    }
  
  return (
    <div className={`flex w-full h-fit gap-2 items-center`}>
        <div onMouseDown={handleMouseDown}  id='slider' ref={sliderRef} className={`relative flex w-full h-4 rounded-full items-center ${className}`}>
            <div  className={`flex w-full absolute bg-base-100 pointer-events-none ${bgStyle}`} />
            {/* Track (fill to current position) */}
            <div  className={`flex absolute rounded-l-full left-0 ${selectedHeight} bg-neutral transition-none pointer-events-none"`} style={{ width: `${position+(thumbXSize*0.15)}px` }} />
            {/* Draggable handle */}
            <div onMouseDown={(e) => {e.stopPropagation(); handleMouseDown(e);}}  className={`absolute ${thumbDimensions} bg-base-100 border-neutral rounded-full cursor-pointer `} style={{ left: `${position - 8}px` }} />
            
        </div>
        <input  value={Number.isNaN(v)?"":v} className='flex w-10 rounded-lg border-2 px-1 h-8 items-center text-md outline-none bg-base-100' onChange={handleValueChange} />
    </div>
  )
}

