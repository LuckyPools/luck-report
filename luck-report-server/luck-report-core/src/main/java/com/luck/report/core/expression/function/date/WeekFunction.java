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
package com.luck.report.core.expression.function.date;

import com.luck.report.core.build.Context;
import com.luck.report.core.exception.ReportComputeException;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.model.Cell;

import java.util.Calendar;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2017年1月22日
 */
public class WeekFunction extends CalendarFunction {

    @Override
    public Object execute(List<ExpressionData<?>> dataList, Context context, Cell currentCell) {
        Calendar c = buildCalendar(dataList);
        int weekDay = c.get(Calendar.DAY_OF_WEEK);
        switch (weekDay) {
            case Calendar.MONDAY:
                return "星期一";
            case Calendar.TUESDAY:
                return "星期二";
            case Calendar.WEDNESDAY:
                return "星期三";
            case Calendar.THURSDAY:
                return "星期四";
            case Calendar.FRIDAY:
                return "星期五";
            case Calendar.SATURDAY:
                return "星期六";
            case Calendar.SUNDAY:
                return "星期日";
        }
        throw new ReportComputeException("Unknow week day :" + weekDay);
    }

    @Override
    public String name() {
        return "week";
    }
}
