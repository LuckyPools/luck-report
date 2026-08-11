import request from "@/utils/request";

export async function loadReport(formData) {
  return await request.post('/designer/loadReport', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}


export async function testConnection(formData) {
  return await request.post('/datasource/testConnection', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export async function previewData(parameters) {
  const formData = new URLSearchParams();
  for (const key in parameters) {
    const value = parameters[key];
    if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  }

  return await request.post('/datasource/previewData', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

export async function loadBuildinDatasources() {
  return await request.get('/datasource/loadBuildinDatasources');
}

export async function buildFields(parameters) {
  const formData = new FormData();
  for (const key in parameters) {
    formData.append(key, parameters[key]);
  }

  return await request.post('/datasource/buildFields', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

export async function scriptValidation(content) {
  const formData = new FormData();
  formData.append('content', content);

  return await request.post('/designer/scriptValidation', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

export async function conditionScriptValidation(content) {
  const formData = new FormData();
  formData.append('content', content);

  return await request.post('/designer/conditionScriptValidation', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

export async function buildDatabaseTables(parameters) {
  const formData = new FormData();
  for (const key in parameters) {
    formData.append(key, parameters[key]);
  }

  return await request.post('/datasource/buildDatabaseTables', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

export async function buildJdbcFields(parameters) {
  const formData = new FormData();
  for (const key in parameters) {
    formData.append(key, parameters[key]);
  }
  return await request.post('/datasource/buildFields', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

export async function loadMethods(beanId) {
  return await request.get('/datasource/loadMethods', {
    params: { beanId }
  });
}

export async function buildClass(clazz) {
  return await request.get('/datasource/buildClass', {
    params: { clazz }
  });
}

export async function parseDatasetName(expr) {
  const formData = new FormData();
  formData.append('expr', expr);
  return await request.post('/designer/parseDatasetName', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

export async function saveReportFile(file, content) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('content', content);
  return await request.post('/designer/saveReportFile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export async function deleteReportFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return await request.post('/designer/deleteReportFile', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

export async function savePreviewFile(fileName, content) {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('fileName', fileName);
  return await request.post('/designer/savePreviewFile', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
}

export async function loadReportProviders() {
  return await request.get('/designer/loadReportProviders');
}

export async function loadReportProvidersByPath(path) {
  return await request.get('/designer/loadReportProviders', {
    params: { path }
  });
}

export async function importExcelFile(file) {
  const formData = new FormData();
  formData.append('_excel_file', file);

  return await request.post('/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export async function parseExcelToJson(formData) {
  return await request.post('/import/parseToJson', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}