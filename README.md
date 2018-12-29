# sRGB Encoding
Encoding images in colorful noise so that they may be viewed through a grayscale filter

The algorithm works by 

1.) Converting the image to a linear RGB color space through gamma expansion 

2.) Calculating their luminance by the specified grayscale algorithm

3.) Setting the linear RGB values to the calculated luminance

4.) Converting the new linear RGB values to the new, non-linear sRGB color space

