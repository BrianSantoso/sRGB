'use strict'

let ctx, canvas, imgUpload
const coefficients = {
    "REC601": [0.299, 0.587, 0.114],
    "REC709": [0.2125, 0.7154, 0.0721],
    "REC2100": [0.2627, 0.6780, 0.0593],
//    "REC2100": [0.26, 0.68, 0.06],
    "AVG": [1/3, 1/3, 1/3]
//    "undefined": [0, 0, 0]
}

window.onload = function(){
    canvas = document.getElementById('canvas')
    ctx = canvas.getContext('2d')
    
    imgUpload = document.getElementById('imgUpload')
}

function encode(){
    // TODO make it the actual images width
    let width = imgUpload.width || imgUpload.height
    let height = imgUpload.height || imgUpload.width
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imgUpload, 0, 0, width, height)
    
    let imageData = ctx.getImageData(0, 0, width, height)
    let bitmap = imageData.data
    let newImageData = ctx.createImageData(imageData)
    
    const tileSize = 2
    
    ctx.clearRect(0, 0, width, height)
    for(let x = 0; x < width; x+=tileSize){
        for(let y = 0; y < height; y+=tileSize){
            
            let redIndex = getPixelIndex(x, y, width)
//            let grayscale = (bitmap[redIndex] + bitmap[redIndex + 1] + bitmap[redIndex + 2])/3
//            console.log(bitmap[redIndex])
            let rgb = [bitmap[redIndex], bitmap[redIndex + 1], bitmap[redIndex + 2]].map(c => c / 255)
            let newRGB = noise(rgb, 'REC601').map(c => Math.round(c * 255))
            newImageData.data[redIndex] = newRGB[0]
            newImageData.data[redIndex + 1] = newRGB[1]
            newImageData.data[redIndex + 2] = newRGB[2]
            newImageData.data[redIndex + 3] = 1
            
            ctx.fillStyle = rgba(newRGB[0], newRGB[1], newRGB[2])
//            console.log(ctx.fillStyle)
            
//            let g = (newRGB[0] + newRGB[1] + newRGB[2])/3
//            ctx.fillStyle = "rgba(" + g + "," + g + "," + g + "," + 1 + ")"
            
            ctx.fillRect(x, y, tileSize, tileSize)
//            console.log(newRGB)
//            console.log(x, y)
        }
    }
    
//    ctx.putImageData(newImageData, 0, 0)
    console.log(newImageData)
    
}

function rgba(r, g, b, a=1){
    
    return "rgba(" + r + "," + g + "," + b + "," + 1 + ")"
}

function getPixelIndex(x, y, width){
        
    return y * width * 4 + x * 4;

}

function nRandomSum(n, sum){
    // Randomly generate N numbers that sum to a fixed value 'sum'
    let random = []
    for(let i = 0; i < n; i++){
        random.push(Math.random())
    }
    
    let randomSum = random.reduce((sum_, currentSum) => sum_ + currentSum, 0)
    let normalized = random.map(num => num / randomSum)
    let scaled = normalized.map(num => num * (sum + 1))
    let floored = scaled.map(num => Math.floor(num))
    
    return floored
}

function randomRGB(avg){
    // Generate a random RGB with a fixed grayscale value
    let sum = avg * 3
    let rgb = nRandomSum(3, sum)
    while(rgb[0] > 255 || rgb[1] > 255 || rgb[2] > 255){
        rgb = nRandomSum(3, sum)
    }
//    console.log( (rgb[0] + rgb[1] + rgb[2])/3 )
    return rgb
    
//    let three_avg = avg*3
//    let red = randInt(0, three_avg, true)
//    while(red < 0 || red > 255){
//        red = randInt(0, three_avg, true)
//    }
//    let green = randInt(0, three_avg - red, true)
//    while(green < 0 || green > 255){
//        green = randInt(0, three_avg - red, true)
//    }
//    let blue = three_avg - (red + green)
//    
//    
//    console.log( (red + green + blue)/3 )
//    console.log( red>255 || green>255 || blue>255 )
//    return [red, green, blue]
    
    
    
}

function randInt(lower, upper, inclusive=false){
    let range = upper - lower + +!!inclusive
    let random = Math.floor(Math.random() * range)
    random += lower
    return random
}

function removeGamma(sRGB){
    
    // Undo gamma compression (transform non-linear sRGB to linear RGB)
    
    const threshold = 0.04045
    const a = 0.055
    let linear
    if(sRGB <= threshold){
        linear = sRGB / 12.92
    } else {
        linear = Math.pow((sRGB + a)/(1 + a), 2.4)
    }
    return linear
        
}

function applyGamma(linear){
    
    // Gamma compress (transform linear RGB to non-linear sRGB)
    
    const threshold = 0.0031308
    const a = 0.055
    let sRGB
    if(linear <= threshold){
        sRGB = linear * 12.92
    } else {
        sRGB = (1 + a) * Math.pow(linear, 1/2.4) - a
    }
    
    return sRGB
    
}

function calculateLuminance(sRGB, alg){
    
    let coeffs = coefficients[alg]
    let linear = sRGB.map(removeGamma)
    let luma = Vector.dot(linear, coeffs)
    return luma
    
}

const Vector = {
    
    UP: [0, 1, 0],
    DOWN: [0, -1, 0],
    RIGHT: [1, 0, 0],
    LEFT: [-1, 0, 0],
    FORWARD: [0, 0, 1],
    BACK: [0, 0, -1],
    ZERO: [0, 0, 0],
    
    dot: function(a, b){
    
        if(a.length !== b.length)
            throw "Incompatible dimensions for dot product!"
        let sum = 0
        for(let i = 0; i < a.length; i++){
            sum += a[i] * b[i]
        }
        return sum

    },
    
    add: function(a, b){
        if(a.length !== b.length)
            throw "Incompatible dimensions for addition!"
        
        let c = new Array(a.length)
        for(let i = 0; i < a.length; i++){
            c[i] = a[i] + b[i]
        }
        return c
    },
    
    sub: function(a, b){
        if(a.length !== b.length)
            throw "Incompatible dimensions for subtraction!"
        
        let c = new Array(a.length)
        for(let i = 0; i < a.length; i++){
            c[i] = a[i] - b[i]
        }
        return c
    },
    
    normalize: function(a){
        
        return Vector.scale(a, 1/Vector.length(a))
        
    },
    
    squaredLength: function(a){
        
        return Vector.dot(a, a)
        
    },
    
    length: function(a){
        
        return Math.sqrt(Vector.squaredLength(a))
        
    },
    
    scale: function(a, t){
        
        return a.map(n => n*t)
        
    },
    
    cross: function(a, b){
        
        return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]]
        
    },
    
    mirror: function(a, b, normal){
        
        return Vector.add(Vector.add(Vector.scale(b, -1), Vector.scale(a, 2)), Vector.scale(normal, 2 * Vector.dot(Vector.sub(b, a), normal)))
//        return Vector.scale(, 2 * Vector.dot())
        
    }
    
}

const test = [0/255, 183.813/255, 255/255]
function noise(sRGB, alg){
    
//    let coeffs = coefficients[alg]
//    let targetLuma = calculateLuminance(sRGB, alg)
//    
//    let planePos = [targetLuma * 255, targetLuma * 255, targetLuma * 255]
//    
//    let linear = randomPoint(Vector.ZERO, 255, planePos, Vector.normalize(coeffs))
    
    let coeffs = coefficients[alg]
    let targetLuma = calculateLuminance(sRGB, alg)
    let planePos = [targetLuma * 255, targetLuma * 255, targetLuma * 255]
    let planNorm = Vector.normalize(coeffs)
    let linear = randomPoint(Vector.ZERO, 255, planePos, planNorm)
    
    console.log('randomPoint', linear)
    linear = linear.map(c => c / 255)
    let gamma = linear.map(applyGamma)
    
    console.log('targetLuma', targetLuma)
    console.log('planepos', planePos)
    console.log('linear01', linear)
    
    return gamma
    
}

function randomPoint(cubePos, sideLength, planePos, planeNorm){
    
    // Finds the cross section between a cube and a plane and uniformly samples a random point from it
    
    // Make sure planeNorm is normalized
    let vertices = cubeXplane(cubePos, sideLength, planePos, planeNorm)
    console.log('VERRERERTICEES', vertices)
    console.log(cubePos, sideLength, planePos, planeNorm)
    vertices = orderVertices(vertices)
    let linear = sampleRandomPointFromPolygon(vertices)
    
    return linear
    
    
    
//    return [100/255, 100/255, 100/255];
    
    
    
}

function segmentXplane(a, b, planePos, planeNorm){
    
    let denom = Vector.dot(planeNorm, Vector.sub(b, a))
    if(denom == 0) return
    let numerator = Vector.dot(planeNorm, Vector.sub(planePos, a))
    let t = numerator / denom
    if(t < 0 || t > 1) return
    return Vector.add(a, Vector.scale(Vector.sub(b, a), t))
    
//    let segmentDirection = Vector.normalize(Vector.sub(b, a))
//    let segmentLength = Vector.length(Vector.sub(b, a))
//    
//    let denom = Vector.dot(segmentDirection, planeNorm)
//        
//    if(denom == 0) return
//
//    let t = Vector.dot(Vector.sub(planePos, a), planeNorm) / denom
//    if(t > segmentLength || t < 0) return
//
//    let intersection = Vector.add(a, Vector.scale(segmentDirection, t))
//
//    return intersection
    
//    let segmentDirection = Vector.sub(b, a)
//    let segmentLength = Vector.length(Vector.sub(b, a))
//    
//    let denom = Vector.dot(segmentDirection, planeNorm)
//        
//    if(denom == 0) return
//
//    let t = Vector.dot(Vector.sub(planePos, a), planeNorm) / denom
//    if(t < 0 || t > 1) return
//
//    let intersection = Vector.add(a, Vector.scale(segmentDirection, t))
//
//    return intersection
}

function cubeXplane(cubePos, sideLength, planePos, planeNorm){
    //cubeXplane(Vector.ZERO, 255, [100, 100, 100], Vector.normalize(coefficients['REC601']))
    
    const up = Vector.scale(Vector.UP, sideLength)
    const right = Vector.scale(Vector.RIGHT, sideLength)
    const forward = Vector.scale(Vector.FORWARD, sideLength)
    
    const a = cubePos
    const b = Vector.add(cubePos, right)
    const c = Vector.add(Vector.add(cubePos, right), forward)
    const d = Vector.add(cubePos, forward)
    const e = Vector.add(a, up)
    const f = Vector.add(b, up)
    const g = Vector.add(c, up)
    const h = Vector.add(d, up)
    
    
    let intersections = []
    let x = segmentXplane(a, b, planePos, planeNorm)
    console.log(x)
    if (x) intersections.push(x)
    
    x = segmentXplane(b, c, planePos, planeNorm)
    console.log(x)
    if (x) intersections.push(x)
    
    x = segmentXplane(c, d, planePos, planeNorm)
    console.log(x)
    if (x) intersections.push(x)
    
    x = segmentXplane(d, a, planePos, planeNorm)
    console.log(x)
    if (x) intersections.push(x)
    
    x = segmentXplane(a, e, planePos, planeNorm)
    console.log(x)
    if (x) intersections.push(x)
    
    x = segmentXplane(b, f, planePos, planeNorm)
    console.log(x)
    if (x) intersections.push(x)
    
    x = segmentXplane(c, g, planePos, planeNorm)
    console.log(x)
    if (x) intersections.push(x)
    
    x = segmentXplane(d, h, planePos, planeNorm)
    console.log(x)
    if (x) intersections.push(x)
    
    x = segmentXplane(e, f, planePos, planeNorm)
    console.log(x)
    if (x) intersections.push(x)
    
    x = segmentXplane(f, g, planePos, planeNorm)
    console.log(x)
    if (x) intersections.push(x)
    
    x = segmentXplane(g, h, planePos, planeNorm)
    console.log(x)
    if (x) intersections.push(x)
    
    x = segmentXplane(h, e, planePos, planeNorm)
    console.log(x)
    if (x) intersections.push(x)
    
    return intersections
    
}

// vertices = cubeXplane(Vector.ZERO, 255, [100, 100, 100], Vector.normalize(coefficients['REC2100']))
function sampleRandomPointFromPolygon(vertices){
    
    // still need to order vertices in order of counter clockwise
    
    if (vertices < 3)
        throw "Not enough vertices to create polygon!"
    
    vertices = orderVertices(vertices)
    let pivot = vertices[0]
    let samples = new Array(vertices.length - 2)
    let areas = new Array(vertices.length - 2)
    
    for(let i = 0; i < vertices.length - 2; i++){
        
        let a = Vector.sub(vertices[i + 1], pivot)
        let b = Vector.sub(vertices[i + 2], pivot)
        let c = Vector.sub(b, a)
        
        let v0 = pivot
        let v1 = Vector.add(pivot, a)
        let v2 = Vector.add(pivot, b)
        
        let randomA = Math.random()
        let randomB = Math.random()

        let randomPointA = Vector.scale(a, randomA)
        let randomPointB = Vector.scale(b, randomB) // ?
        
//        console.log(a, b)
//        console.log(randomA, randomB)
        
        
        let sampled = Vector.add(pivot, Vector.add(randomPointA, randomPointB))
        
//        console.log("sampled", sampled)
//        console.log('randompoints', randomPointA, randomPointB)
//        console.log(randomPointA, randomPointB)
        
        let normal = Vector.normalize(c)
        let sampleTestVector1 = Vector.sub(sampled, v1)
        let testVector2 = Vector.sub(v0, v1)
        let cross1 = Vector.cross(sampleTestVector1, normal)
        let cross2 = Vector.cross(testVector2, normal)
        let inside = Vector.dot(cross1, cross2) > 0
        
        if(!inside){
            console.log('NOT INSIDE', sampled)
            let v3 =Vector.add(pivot, Vector.add(a, b))
            let anchor = Vector.sub(sampled, v3) //?
            let flippedAnchor = Vector.scale(anchor, -1)
            sampled = Vector.add(pivot, flippedAnchor)
            
//            console.log(v0, v1, v2)
//            sampled = Vector.mirror(v1, sampled, normal)
            console.log('mirrored!')
        }
        
        let area = 0.5 * Vector.length(Vector.cross(a, b))
        areas[i] = area
        
//        console.log(area)
        
//        if(Vector.dot(Vector.cross(Vector.sub(sampled, Vector.add(pivot, a)), c), Vector.cross(Vector.sub(Vector.add(a, pivot), pivot), c)) < 0){
//            sampled = Vector.mirror(Vector.add(pivot, a), sampled, Vector.normalize(Vector.sub(c, Vector.add(a, pivot))))
//        }

        samples[i] = sampled
        
        console.log('SAMPLED', sampled)
    }
    
    let totalArea = areas.reduce((sum, currentSum) => sum + currentSum)
    let probabilities = areas.map(area => area / totalArea)
    let cumulativeProbabilities = new Array(probabilities.length + 1)
    cumulativeProbabilities[0] = 0
    for(let i = 1; i < cumulativeProbabilities.length; i++){
        cumulativeProbabilities[i] = probabilities[i - 1] + cumulativeProbabilities[i - 1]
    }
    
//    console.log(cumulativeProbabilities)
    
    let randomValue = Math.random()
    let selectedIndex = findBucket(cumulativeProbabilities, randomValue)
    
//    return samples //temp
    console.log('samples', samples)
    return samples[selectedIndex]
    
}

function findBucket(orderedArr, val){
    
    for(let i = 0; i < orderedArr.length; i++){
        if(val < orderedArr[i])
            return i - 1
    }
        
    return
    
}

function orderVertices(vertices){
    
    // Constructs a polygon by ordering vertices in counter clockwise fashion
    
    if (vertices < 3)
        throw "Not enough vertices to create polygon!"
    
    function compare(a, b) {
        if (a['cos'] < b['cos']) {
            return -1;
        }
        if (a['cos'] > b['cos']) {
            return 1;
        }
        // a must be equal to b
        return 0;
    }
    
    const pivot = vertices[0]
    const direction = Vector.sub(vertices[1], pivot)
    let newVertices = new Array(vertices.length)
    newVertices[0] = pivot
    let paired = new Array(vertices.length - 1)
    
    for(let i = 0; i < paired.length; i++){
        
        let vec = Vector.sub(vertices[i + 1], pivot)
        
        paired[i] = {
            v: vertices[i + 1],
            cos: Math.acos(Vector.dot(vec, direction) / (Vector.length(vec) * Vector.length(direction)))
        }
    }
    
    let sortedPairs = paired.sort(compare)
    sortedPairs = sortedPairs.map(pair => pair['v'])
    
    return [pivot].concat(sortedPairs)
    
    
    
    
}

function indexOfMaxValue (arr){
    return arr.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
} 

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

//function binarySearch(arr, searchElement) {
//    'use strict';
// 
//    var minIndex = 0;
//    var maxIndex = arr.length - 1;
//    var currentIndex;
//    var currentElement;
// 
//    while (minIndex <= maxIndex) {
//        currentIndex = (minIndex + maxIndex) / 2 | 0;
//        currentElement = arr[currentIndex];
// 
//        if (currentElement < searchElement) {
//            minIndex = currentIndex + 1;
//        }
//        else if (currentElement > searchElement) {
//            maxIndex = currentIndex - 1;
//        }
//        else {
//            return currentIndex;
//        }
//    }
// 
//    return -1;
////    return currentIndex;
//}