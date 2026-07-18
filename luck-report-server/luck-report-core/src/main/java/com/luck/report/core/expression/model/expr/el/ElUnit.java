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
package com.luck.report.core.expression.model.expr.el;

import com.luck.report.core.exception.ReportComputeException;
import com.luck.report.core.expression.model.Operator;
import com.luck.report.core.utils.ArithUtils;

import java.io.Serializable;

/**
 * @author Jacky.gao
 * @since 2017年4月25日
 */
public class ElUnit implements Serializable {
    private static final long serialVersionUID = 1L;
    private Object left;
    private Object right;
    private Operator op;
    private Operator nextOp;
    private ElUnit nextUnit;

    public ElUnit() {}

    public Object compute() {
        if (right instanceof ElUnit) {
            right = ((ElUnit) right).compute();
        }
        switch (op) {
            case Add:
                return ArithUtils.add(left, right);
            case Complementation:
                return ArithUtils.com(left, right);
            case Divide:
                return ArithUtils.div(left, right);
            case Multiply:
                return ArithUtils.mul(left, right);
            case Subtract:
                return ArithUtils.sub(left, right);
        }
        throw new ReportComputeException("Unknow operator :" + op);
    }

    public Object getLeft() {
        return left;
    }

    public void setLeft(Object left) {
        this.left = left;
    }

    public Object getRight() {
        return right;
    }

    public void setRight(Object right) {
        this.right = right;
    }

    public Operator getOp() {
        return op;
    }

    public void setOp(Operator op) {
        this.op = op;
    }

    public Operator getNextOp() {
        return nextOp;
    }

    public void setNextOp(Operator nextOp) {
        this.nextOp = nextOp;
    }

    public ElUnit getNextUnit() {
        return nextUnit;
    }

    public void setNextUnit(ElUnit nextUnit) {
        this.nextUnit = nextUnit;
    }
}
