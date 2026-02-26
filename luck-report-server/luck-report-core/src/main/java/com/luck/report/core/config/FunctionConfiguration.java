package com.luck.report.core.config;

import com.luck.report.core.expression.function.*;
import com.luck.report.core.expression.function.date.*;
import com.luck.report.core.expression.function.math.*;
import com.luck.report.core.expression.function.page.*;
import com.luck.report.core.expression.function.string.*;
import com.luck.report.core.expression.function.*;
import com.luck.report.core.expression.function.date.*;
import com.luck.report.core.expression.function.math.*;
import com.luck.report.core.expression.function.page.*;
import com.luck.report.core.expression.function.string.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FunctionConfiguration {

    // 统计函数
    @Bean
    public CountFunction countFunction() {
        return new CountFunction();
    }

    @Bean
    public SumFunction sumFunction() {
        return new SumFunction();
    }

    @Bean
    public MaxFunction maxFunction() {
        return new MaxFunction();
    }

    @Bean
    public MinFunction minFunction() {
        return new MinFunction();
    }

    @Bean
    public ListFunction listFunction() {
        return new ListFunction();
    }

    @Bean
    public AvgFunction avgFunction() {
        return new AvgFunction();
    }

    @Bean
    public OrderFunction orderFunction() {
        return new OrderFunction();
    }

    // 日期函数
    @Bean
    public WeekFunction weekFunction() {
        return new WeekFunction();
    }

    @Bean
    public DayFunction dayFunction() {
        return new DayFunction();
    }

    @Bean
    public MonthFunction monthFunction() {
        return new MonthFunction();
    }

    @Bean
    public YearFunction yearFunction() {
        return new YearFunction();
    }

    @Bean
    public DateFunction dateFunction() {
        return new DateFunction();
    }

    @Bean
    public FormatDateFunction formatDateFunction() {
        return new FormatDateFunction();
    }

    // 数学函数
    @Bean
    public AbsFunction absFunction() {
        return new AbsFunction();
    }

    @Bean
    public CeilFunction ceilFunction() {
        return new CeilFunction();
    }

    @Bean
    public ChnFunction chnFunction() {
        return new ChnFunction();
    }

    @Bean
    public ChnMoneyFunction chnMoneyFunction() {
        return new ChnMoneyFunction();
    }

    @Bean
    public CosFunction cosFunction() {
        return new CosFunction();
    }

    @Bean
    public ExpFunction expFunction() {
        return new ExpFunction();
    }

    @Bean
    public FloorFunction floorFunction() {
        return new FloorFunction();
    }

    @Bean
    public Log10Function log10Function() {
        return new Log10Function();
    }

    @Bean
    public LogFunction logFunction() {
        return new LogFunction();
    }

    @Bean
    public PowFunction powFunction() {
        return new PowFunction();
    }

    @Bean
    public RandomFunction randomFunction() {
        return new RandomFunction();
    }

    @Bean
    public RoundFunction roundFunction() {
        return new RoundFunction();
    }

    @Bean
    public SinFunction sinFunction() {
        return new SinFunction();
    }

    @Bean
    public SqrtFunction sqrtFunction() {
        return new SqrtFunction();
    }

    @Bean
    public TanFunction tanFunction() {
        return new TanFunction();
    }

    @Bean
    public StdevpFunction stdevpFunction() {
        return new StdevpFunction();
    }

    @Bean
    public VaraFunction varaFunction() {
        return new VaraFunction();
    }

    @Bean
    public ModeFunction modeFunction() {
        return new ModeFunction();
    }

    @Bean
    public MedianFunction medianFunction() {
        return new MedianFunction();
    }

    // 字符串函数
    @Bean
    public LengthFunction lengthFunction() {
        return new LengthFunction();
    }

    @Bean
    public LowerFunction lowerFunction() {
        return new LowerFunction();
    }

    @Bean
    public IndexOfFunction indexOfFunction() {
        return new IndexOfFunction();
    }

    @Bean
    public ReplaceFunction replaceFunction() {
        return new ReplaceFunction();
    }

    @Bean
    public SubstringFunction substringFunction() {
        return new SubstringFunction();
    }

    @Bean
    public TrimFunction trimFunction() {
        return new TrimFunction();
    }

    @Bean
    public UpperFunction upperFunction() {
        return new UpperFunction();
    }

    // 页面函数
    @Bean
    public PageTotalFunction pageTotalFunction() {
        return new PageTotalFunction();
    }

    @Bean
    public PageNumberFunction pageNumberFunction() {
        return new PageNumberFunction();
    }

    @Bean
    public PageAvgFunction pageAvgFunction() {
        return new PageAvgFunction();
    }

    @Bean
    public PageCountFunction pageCountFunction() {
        return new PageCountFunction();
    }

    @Bean
    public PageMaxFunction pageMaxFunction() {
        return new PageMaxFunction();
    }

    @Bean
    public PageMinFunction pageMinFunction() {
        return new PageMinFunction();
    }

    @Bean
    public PageRowsFunction pageRowsFunction() {
        return new PageRowsFunction();
    }

    @Bean
    public PageSumFunction pageSumFunction() {
        return new PageSumFunction();
    }

    // 其他函数
    @Bean
    public FormatNumberFunction formatNumberFunction() {
        return new FormatNumberFunction();
    }

    @Bean
    public GetFunction getFunction() {
        return new GetFunction();
    }

    @Bean
    public ParameterFunction parameterFunction() {
        return new ParameterFunction();
    }

    @Bean
    public ParameterIsEmptyFunction parameterIsEmptyFunction() {
        return new ParameterIsEmptyFunction();
    }

    @Bean
    public JsonFunction jsonFunction() {
        return new JsonFunction();
    }

    @Bean
    public RowFunction rowFunction() {
        return new RowFunction();
    }

    @Bean
    public ColumnFunction columnFunction() {
        return new ColumnFunction();
    }
}
