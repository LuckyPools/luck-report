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
import com.luck.report.core.model.Image;
import org.apache.commons.io.IOUtils;

import javax.imageio.ImageIO;
import java.awt.AlphaComposite;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

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
        byte[] bytes = Base64.getDecoder().decode(base64Data);
        ByteArrayInputStream inputStream = new ByteArrayInputStream(bytes);
        return inputStream;
    }

    /**
     * 将base64编码的图片按指定宽高缩放后返回新的base64数据
     * @param base64Data 纯base64数据（不含data:image/xxx;base64,前缀）
     * @param width 目标宽度，0或负数表示不缩放该边
     * @param height 目标高度，0或负数表示不缩放该边
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
            return Base64.getEncoder().encodeToString(scaleImageBytes(srcImage, width, height));
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
            if (width > 0 || height > 0) {
                BufferedImage inputImage = ImageIO.read(inputStream);
                return Base64.getEncoder().encodeToString(scaleImageBytes(inputImage, width, height));
            }
            byte[] bytes = IOUtils.toByteArray(inputStream);
            return Base64.getEncoder().encodeToString(bytes);
        } catch (Exception ex) {
            throw new ReportComputeException(ex);
        } finally {
            IOUtils.closeQuietly(inputStream);
        }
    }

    /**
     * 导出绘制尺寸：优先使用 Image 声明宽高，未声明（&lt;=0）则用图片像素。
     *
     * @param img 报表图片对象，可为 null
     * @param bufferedImage 已解码的位图
     * @return [width, height]，单位像素
     */
    public static int[] resolveExportSize(Image img, BufferedImage bufferedImage) {
        int naturalW = Math.max(1, bufferedImage.getWidth());
        int naturalH = Math.max(1, bufferedImage.getHeight());
        int w = img != null && img.getWidth() > 0 ? img.getWidth() : naturalW;
        int h = img != null && img.getHeight() > 0 ? img.getHeight() : naturalH;
        return new int[]{w, h};
    }

    /**
     * 按请求宽高缩放；某一边 &lt;=0 时保留源图对应边。
     */
    private static byte[] scaleImageBytes(BufferedImage srcImage, int width, int height) throws Exception {
        int srcWidth = srcImage.getWidth();
        int srcHeight = srcImage.getHeight();
        int targetWidth = width > 0 ? width : srcWidth;
        int targetHeight = height > 0 ? height : srcHeight;
        if (targetWidth == srcWidth && targetHeight == srcHeight) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(srcImage, "png", baos);
            return baos.toByteArray();
        }
        BufferedImage scaledImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = scaledImage.createGraphics();
        try {
            g.setComposite(AlphaComposite.SrcOver);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(srcImage, 0, 0, targetWidth, targetHeight, null);
        } finally {
            g.dispose();
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(scaledImage, "png", baos);
        return baos.toByteArray();
    }
}
