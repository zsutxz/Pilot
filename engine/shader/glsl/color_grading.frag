#version 310 es

#extension GL_GOOGLE_include_directive : enable

#include "constants.h"

layout(input_attachment_index = 0, set = 0, binding = 0) uniform highp subpassInput in_color;

layout(set = 0, binding = 1) uniform sampler2D color_grading_lut_texture_sampler;

layout(location = 0) out highp vec4 out_color;

void main()
{
    highp ivec2 lut_tex_size = textureSize(color_grading_lut_texture_sampler, 0);
    highp float _COLORS      = float(lut_tex_size.y);

    highp vec4 color       = subpassLoad(in_color).rgba;
    
    highp float blueColor = color.b * 15.0;
    
    // 计算B通道，看使用哪个像素色块（这里分别对计算结果向上，向下取整，然后再对两者进行线性计算，减小误差）
    highp vec2 quad1;
    quad1.y = floor(floor(blueColor) / 16.0);
    quad1.x = floor(blueColor) - (quad1.y * 16.0);
    
    highp vec2 quad2;
    quad2.y = floor(ceil(blueColor) / 16.0);
    quad2.x = ceil(blueColor) - (quad2.y * 16.0);
    
    // 计算R、G通道
    highp vec2 texPos1;
    texPos1.x = (quad1.x * 0.125/2.0) + 0.5/256.0 + ((0.125/2.0 - 1.0/256.0) * color.r);
    texPos1.y = (quad1.y * 0.125/2.0) + 0.5/256.0 + ((0.125/2.0 - 1.0/256.0) * color.g);
     
    highp vec2 texPos2;
    texPos2.x = (quad2.x * 0.125/2.0) + 0.5/256.0 + ((0.125/2.0 - 1.0/256.0) * color.r);
    texPos2.y = (quad2.y * 0.125/2.0) + 0.5/256.0 + ((0.125/2.0 - 1.0/256.0) * color.g);
    
    // 根据转换后的纹理坐标，在基准图上取色
    lowp vec4 newColor1 = texture(color_grading_lut_texture_sampler, texPos1);
    lowp vec4 newColor2 = texture(color_grading_lut_texture_sampler, texPos2);
    
    // 对计算出来的两个色值，线性求平均(fract：取小数点后值)
    lowp vec4 newcolor = mix(newColor1, newColor2, fract(blueColor));
    
    // intensity 按需计算滤镜透明度，混合计算前后的色值
    out_color = mix(color, vec4(newcolor.rgb, color.w), 0.3f);

}
