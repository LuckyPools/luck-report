package com.luck.report.pub.config;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component("testBean")
public class TestBean {
   public List<Map<String,Object>> loadReportData(String dsName, String datasetName, Map<String,Object> parameters){
      List<Map<String, Object>> list = new ArrayList<>();
      for (int i = 0; i < 1000; i++) {
         Map<String, Object> m = new HashMap<String, Object>();
         m.put("id", i);
         list.add(m);
      }
      return list;
   }
   public List<Map<String,Object>> buildReport(String dsName,String datasetName,Map<String,Object> parameters){
      List<Map<String, Object>> list = new ArrayList<>();
      for (int i = 0; i < 1000; i++) {
         Map<String, Object> m = new HashMap<String, Object>();
         m.put("name", i);
         list.add(m);
      }
      return list;
   }
}
