package com.luck.report.web.provider;

import java.io.IOException;
import java.io.OutputStream;

public interface ResponseInfoProvider {

    void writeObjectToJson( Object obj) throws IOException;

    void setContentType(String contentType);

    void setHeader(String key,String value);

    OutputStream getOutputStream() throws IOException;

    void setStatus(int status);
}
