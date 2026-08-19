/*******************************************************************************
 * Copyright 2017 Bstek
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.  You may obtain a copy
 * of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/
package com.luck.report.core.utils;

import com.luck.report.core.exception.ReportComputeException;
import com.luck.report.core.image.ChartImageProcessor;
import com.luck.report.core.image.ImageProcessor;
import com.luck.report.core.image.ImageType;
import com.luck.report.core.image.StaticImageProcessor;
import org.apache.commons.io.IOUtils;
import org.springframework.util.Base64Utils;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import java.awt.AlphaComposite;
import java.awt.RenderingHints;

/**
 * @author Jacky.gao
 * @since 2017年3月20日
 */
public class ImageUtils {
    private static Map<ImageType, ImageProcessor<?>> imageProcessorMap = new HashMap<ImageType, ImageProcessor<?>>();

    static {
        StaticImageProcessor staticImageProcessor = new StaticImageProcessor();
        imageProcessorMap.put(ImageType.image, staticImageProcessor);
        ChartImageProcessor chartImageProcessor = new ChartImageProcessor();
        imageProcessorMap.put(ImageType.chart, chartImageProcessor);
    }

    public static InputStream base64DataToInputStream(String base64Data) {
        byte[] bytes = Base64Utils.decodeFromString(base64Data);
        ByteArrayInputStream inputStream = new ByteArrayInputStream(bytes);
        return inputStream;
    }

    /**
     * 将base64编码的图片按指定宽高缩放后返回新的base64数据
     * @param base64Data 纯base64数据（不含data:image/xxx;base64,前缀）
     * @param width 目标宽度，0或负数表示不缩放
     * @param height 目标高度，0或负数表示不缩放
     * @return 缩放后的base64数据（统一输出PNG格式）
     */
    public static String scaleBase64Image(String base64Data, int width, int height) {
        if (width <= 0 && height <= 0) {
            return base64Data;
        }
        try {
            InputStream input = base64DataToInputStream(base64Data);
            BufferedImage srcImage = ImageIO.read(input);
            IOUtils.closeQuietly(input);
            int srcWidth = srcImage.getWidth();
            int srcHeight = srcImage.getHeight();
            int targetWidth = width > 0 ? width : srcWidth;
            int targetHeight = height > 0 ? height : srcHeight;
            BufferedImage scaledImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g = scaledImage.createGraphics();
            g.setComposite(AlphaComposite.SrcOver);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(srcImage, 0, 0, targetWidth, targetHeight, null);
            g.dispose();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(scaledImage, "png", baos);
            return Base64Utils.encodeToString(baos.toByteArray());
        } catch (Exception ex) {
            throw new ReportComputeException(ex);
        }
    }

    @SuppressWarnings("unchecked")
    public static String getImageBase64Data(ImageType type, Object data, int width, int height) {
        ImageProcessor<Object> targetProcessor = (ImageProcessor<Object>) imageProcessorMap.get(type);
        if (targetProcessor == null) {
            throw new ReportComputeException("Unknow image type :" + type);
        }
        InputStream inputStream = targetProcessor.getImage(data);
        try {
            if (width > 0 && height > 0) {
                BufferedImage inputImage = ImageIO.read(inputStream);
                BufferedImage outputImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
                Graphics2D g = outputImage.createGraphics();
                g.setComposite(AlphaComposite.SrcOver);
                g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                g.drawImage(inputImage, 0, 0, width, height, null);
                g.dispose();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                ImageIO.write(outputImage, "png", outputStream);
                inputStream = new ByteArrayInputStream(outputStream.toByteArray());
            }
            byte[] bytes = IOUtils.toByteArray(inputStream);
            return Base64Utils.encodeToString(bytes);
        } catch (Exception ex) {
            throw new ReportComputeException(ex);
        } finally {
            IOUtils.closeQuietly(inputStream);
        }
    }
}
