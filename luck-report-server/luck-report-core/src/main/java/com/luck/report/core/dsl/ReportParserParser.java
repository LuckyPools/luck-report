// Generated from ReportParser.g4 by ANTLR 4.13.1

package com.luck.report.core.dsl;

import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.misc.*;
import org.antlr.v4.runtime.tree.*;
import java.util.List;
import java.util.Iterator;
import java.util.ArrayList;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast", "CheckReturnValue"})
public class ReportParserParser extends Parser {
	static { RuntimeMetaData.checkVersion("4.13.1", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		T__0=1, T__1=2, T__2=3, T__3=4, T__4=5, T__5=6, T__6=7, T__7=8, T__8=9, 
		T__9=10, T__10=11, T__11=12, T__12=13, T__13=14, T__14=15, T__15=16, T__16=17, 
		T__17=18, T__18=19, Cell=20, Operator=21, OP=22, ORDER=23, BOOLEAN=24, 
		COLON=25, COMMA=26, NULL=27, LeftParen=28, RightParen=29, STRING=30, AND=31, 
		OR=32, INTEGER=33, NUMBER=34, EXCLAMATION=35, EXP=36, Identifier=37, LETTER=38, 
		Char=39, DIGIT=40, WS=41, NL=42;
	public static final int
		RULE_entry = 0, RULE_expression = 1, RULE_exprComposite = 2, RULE_ternaryExpr = 3, 
		RULE_caseExpr = 4, RULE_casePart = 5, RULE_ifExpr = 6, RULE_ifPart = 7, 
		RULE_elseIfPart = 8, RULE_elsePart = 9, RULE_block = 10, RULE_exprBlock = 11, 
		RULE_returnExpr = 12, RULE_expr = 13, RULE_ifCondition = 14, RULE_variableAssign = 15, 
		RULE_item = 16, RULE_unit = 17, RULE_variable = 18, RULE_cellPosition = 19, 
		RULE_relativeCell = 20, RULE_currentCellValue = 21, RULE_currentCellData = 22, 
		RULE_cell = 23, RULE_dataset = 24, RULE_function = 25, RULE_functionParameter = 26, 
		RULE_set = 27, RULE_cellCoordinate = 28, RULE_coordinate = 29, RULE_cellIndicator = 30, 
		RULE_conditions = 31, RULE_condition = 32, RULE_property = 33, RULE_currentValue = 34, 
		RULE_simpleValue = 35, RULE_join = 36, RULE_aggregate = 37;
	private static String[] makeRuleNames() {
		return new String[] {
			"entry", "expression", "exprComposite", "ternaryExpr", "caseExpr", "casePart", 
			"ifExpr", "ifPart", "elseIfPart", "elsePart", "block", "exprBlock", "returnExpr", 
			"expr", "ifCondition", "variableAssign", "item", "unit", "variable", 
			"cellPosition", "relativeCell", "currentCellValue", "currentCellData", 
			"cell", "dataset", "function", "functionParameter", "set", "cellCoordinate", 
			"coordinate", "cellIndicator", "conditions", "condition", "property", 
			"currentValue", "simpleValue", "join", "aggregate"
		};
	}
	public static final String[] ruleNames = makeRuleNames();

	private static String[] makeLiteralNames() {
		return new String[] {
			null, "'?'", "'case'", "'{'", "'}'", "'if'", "'else'", "'return'", "';'", 
			"'var'", "'='", "'&'", "'$'", "'#'", "'.'", "'cell'", "'['", "']'", "'to'", 
			"'@'", null, null, null, null, null, "':'", "','", "'null'", "'('", "')'", 
			null, null, null, null, null, "'!'"
		};
	}
	private static final String[] _LITERAL_NAMES = makeLiteralNames();
	private static String[] makeSymbolicNames() {
		return new String[] {
			null, null, null, null, null, null, null, null, null, null, null, null, 
			null, null, null, null, null, null, null, null, "Cell", "Operator", "OP", 
			"ORDER", "BOOLEAN", "COLON", "COMMA", "NULL", "LeftParen", "RightParen", 
			"STRING", "AND", "OR", "INTEGER", "NUMBER", "EXCLAMATION", "EXP", "Identifier", 
			"LETTER", "Char", "DIGIT", "WS", "NL"
		};
	}
	private static final String[] _SYMBOLIC_NAMES = makeSymbolicNames();
	public static final Vocabulary VOCABULARY = new VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);

	/**
	 * @deprecated Use {@link #VOCABULARY} instead.
	 */
	@Deprecated
	public static final String[] tokenNames;
	static {
		tokenNames = new String[_SYMBOLIC_NAMES.length];
		for (int i = 0; i < tokenNames.length; i++) {
			tokenNames[i] = VOCABULARY.getLiteralName(i);
			if (tokenNames[i] == null) {
				tokenNames[i] = VOCABULARY.getSymbolicName(i);
			}

			if (tokenNames[i] == null) {
				tokenNames[i] = "<INVALID>";
			}
		}
	}

	@Override
	@Deprecated
	public String[] getTokenNames() {
		return tokenNames;
	}

	@Override

	public Vocabulary getVocabulary() {
		return VOCABULARY;
	}

	@Override
	public String getGrammarFileName() { return "ReportParser.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public ATN getATN() { return _ATN; }

	public ReportParserParser(TokenStream input) {
		super(input);
		_interp = new ParserATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}

	@SuppressWarnings("CheckReturnValue")
	public static class EntryContext extends ParserRuleContext {
		public TerminalNode EOF() { return getToken(ReportParserParser.EOF, 0); }
		public List<ExpressionContext> expression() {
			return getRuleContexts(ExpressionContext.class);
		}
		public ExpressionContext expression(int i) {
			return getRuleContext(ExpressionContext.class,i);
		}
		public EntryContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_entry; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitEntry(this);
			else return visitor.visitChildren(this);
		}
	}

	public final EntryContext entry() throws RecognitionException {
		EntryContext _localctx = new EntryContext(_ctx, getState());
		enterRule(_localctx, 0, RULE_entry);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(77); 
			_errHandler.sync(this);
			_la = _input.LA(1);
			do {
				{
				{
				setState(76);
				expression();
				}
				}
				setState(79); 
				_errHandler.sync(this);
				_la = _input.LA(1);
			} while ( (((_la) & ~0x3f) == 0 && ((1L << _la) & 164703025828L) != 0) );
			setState(81);
			match(EOF);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ExpressionContext extends ParserRuleContext {
		public ExprCompositeContext exprComposite() {
			return getRuleContext(ExprCompositeContext.class,0);
		}
		public IfExprContext ifExpr() {
			return getRuleContext(IfExprContext.class,0);
		}
		public CaseExprContext caseExpr() {
			return getRuleContext(CaseExprContext.class,0);
		}
		public ReturnExprContext returnExpr() {
			return getRuleContext(ReturnExprContext.class,0);
		}
		public VariableAssignContext variableAssign() {
			return getRuleContext(VariableAssignContext.class,0);
		}
		public ExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_expression; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitExpression(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ExpressionContext expression() throws RecognitionException {
		ExpressionContext _localctx = new ExpressionContext(_ctx, getState());
		enterRule(_localctx, 2, RULE_expression);
		try {
			setState(88);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,1,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(83);
				exprComposite(0);
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(84);
				ifExpr();
				}
				break;
			case 3:
				enterOuterAlt(_localctx, 3);
				{
				setState(85);
				caseExpr();
				}
				break;
			case 4:
				enterOuterAlt(_localctx, 4);
				{
				setState(86);
				returnExpr();
				}
				break;
			case 5:
				enterOuterAlt(_localctx, 5);
				{
				setState(87);
				variableAssign();
				}
				break;
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ExprCompositeContext extends ParserRuleContext {
		public ExprCompositeContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_exprComposite; }
	 
		public ExprCompositeContext() { }
		public void copyFrom(ExprCompositeContext ctx) {
			super.copyFrom(ctx);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class ComplexExprCompositeContext extends ExprCompositeContext {
		public List<ExprCompositeContext> exprComposite() {
			return getRuleContexts(ExprCompositeContext.class);
		}
		public ExprCompositeContext exprComposite(int i) {
			return getRuleContext(ExprCompositeContext.class,i);
		}
		public TerminalNode Operator() { return getToken(ReportParserParser.Operator, 0); }
		public ComplexExprCompositeContext(ExprCompositeContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitComplexExprComposite(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class SingleExprCompositeContext extends ExprCompositeContext {
		public ExprContext expr() {
			return getRuleContext(ExprContext.class,0);
		}
		public SingleExprCompositeContext(ExprCompositeContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitSingleExprComposite(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class ParenExprCompositeContext extends ExprCompositeContext {
		public TerminalNode LeftParen() { return getToken(ReportParserParser.LeftParen, 0); }
		public ExprCompositeContext exprComposite() {
			return getRuleContext(ExprCompositeContext.class,0);
		}
		public TerminalNode RightParen() { return getToken(ReportParserParser.RightParen, 0); }
		public ParenExprCompositeContext(ExprCompositeContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitParenExprComposite(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class TernaryExprCompositeContext extends ExprCompositeContext {
		public TernaryExprContext ternaryExpr() {
			return getRuleContext(TernaryExprContext.class,0);
		}
		public TernaryExprCompositeContext(ExprCompositeContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitTernaryExprComposite(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ExprCompositeContext exprComposite() throws RecognitionException {
		return exprComposite(0);
	}

	private ExprCompositeContext exprComposite(int _p) throws RecognitionException {
		ParserRuleContext _parentctx = _ctx;
		int _parentState = getState();
		ExprCompositeContext _localctx = new ExprCompositeContext(_ctx, _parentState);
		ExprCompositeContext _prevctx = _localctx;
		int _startState = 4;
		enterRecursionRule(_localctx, 4, RULE_exprComposite, _p);
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(97);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,2,_ctx) ) {
			case 1:
				{
				_localctx = new SingleExprCompositeContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;

				setState(91);
				expr();
				}
				break;
			case 2:
				{
				_localctx = new TernaryExprCompositeContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(92);
				ternaryExpr();
				}
				break;
			case 3:
				{
				_localctx = new ParenExprCompositeContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(93);
				match(LeftParen);
				setState(94);
				exprComposite(0);
				setState(95);
				match(RightParen);
				}
				break;
			}
			_ctx.stop = _input.LT(-1);
			setState(104);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,3,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					if ( _parseListeners!=null ) triggerExitRuleEvent();
					_prevctx = _localctx;
					{
					{
					_localctx = new ComplexExprCompositeContext(new ExprCompositeContext(_parentctx, _parentState));
					pushNewRecursionContext(_localctx, _startState, RULE_exprComposite);
					setState(99);
					if (!(precpred(_ctx, 1))) throw new FailedPredicateException(this, "precpred(_ctx, 1)");
					setState(100);
					match(Operator);
					setState(101);
					exprComposite(2);
					}
					} 
				}
				setState(106);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,3,_ctx);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class TernaryExprContext extends ParserRuleContext {
		public List<IfConditionContext> ifCondition() {
			return getRuleContexts(IfConditionContext.class);
		}
		public IfConditionContext ifCondition(int i) {
			return getRuleContext(IfConditionContext.class,i);
		}
		public List<BlockContext> block() {
			return getRuleContexts(BlockContext.class);
		}
		public BlockContext block(int i) {
			return getRuleContext(BlockContext.class,i);
		}
		public TerminalNode COLON() { return getToken(ReportParserParser.COLON, 0); }
		public List<JoinContext> join() {
			return getRuleContexts(JoinContext.class);
		}
		public JoinContext join(int i) {
			return getRuleContext(JoinContext.class,i);
		}
		public TernaryExprContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_ternaryExpr; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitTernaryExpr(this);
			else return visitor.visitChildren(this);
		}
	}

	public final TernaryExprContext ternaryExpr() throws RecognitionException {
		TernaryExprContext _localctx = new TernaryExprContext(_ctx, getState());
		enterRule(_localctx, 6, RULE_ternaryExpr);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(107);
			ifCondition();
			setState(113);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==AND || _la==OR) {
				{
				{
				setState(108);
				join();
				setState(109);
				ifCondition();
				}
				}
				setState(115);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(116);
			match(T__0);
			setState(117);
			block();
			setState(118);
			match(COLON);
			setState(119);
			block();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class CaseExprContext extends ParserRuleContext {
		public List<CasePartContext> casePart() {
			return getRuleContexts(CasePartContext.class);
		}
		public CasePartContext casePart(int i) {
			return getRuleContext(CasePartContext.class,i);
		}
		public List<TerminalNode> COMMA() { return getTokens(ReportParserParser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(ReportParserParser.COMMA, i);
		}
		public CaseExprContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_caseExpr; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCaseExpr(this);
			else return visitor.visitChildren(this);
		}
	}

	public final CaseExprContext caseExpr() throws RecognitionException {
		CaseExprContext _localctx = new CaseExprContext(_ctx, getState());
		enterRule(_localctx, 8, RULE_caseExpr);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(121);
			match(T__1);
			setState(122);
			match(T__2);
			setState(123);
			casePart();
			setState(128);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==COMMA) {
				{
				{
				setState(124);
				match(COMMA);
				setState(125);
				casePart();
				}
				}
				setState(130);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(131);
			match(T__3);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class CasePartContext extends ParserRuleContext {
		public List<IfConditionContext> ifCondition() {
			return getRuleContexts(IfConditionContext.class);
		}
		public IfConditionContext ifCondition(int i) {
			return getRuleContext(IfConditionContext.class,i);
		}
		public BlockContext block() {
			return getRuleContext(BlockContext.class,0);
		}
		public List<JoinContext> join() {
			return getRuleContexts(JoinContext.class);
		}
		public JoinContext join(int i) {
			return getRuleContext(JoinContext.class,i);
		}
		public TerminalNode COLON() { return getToken(ReportParserParser.COLON, 0); }
		public CasePartContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_casePart; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCasePart(this);
			else return visitor.visitChildren(this);
		}
	}

	public final CasePartContext casePart() throws RecognitionException {
		CasePartContext _localctx = new CasePartContext(_ctx, getState());
		enterRule(_localctx, 10, RULE_casePart);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(133);
			ifCondition();
			setState(139);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==AND || _la==OR) {
				{
				{
				setState(134);
				join();
				setState(135);
				ifCondition();
				}
				}
				setState(141);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(143);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==COLON) {
				{
				setState(142);
				match(COLON);
				}
			}

			setState(145);
			block();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class IfExprContext extends ParserRuleContext {
		public IfPartContext ifPart() {
			return getRuleContext(IfPartContext.class,0);
		}
		public List<ElseIfPartContext> elseIfPart() {
			return getRuleContexts(ElseIfPartContext.class);
		}
		public ElseIfPartContext elseIfPart(int i) {
			return getRuleContext(ElseIfPartContext.class,i);
		}
		public ElsePartContext elsePart() {
			return getRuleContext(ElsePartContext.class,0);
		}
		public IfExprContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_ifExpr; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitIfExpr(this);
			else return visitor.visitChildren(this);
		}
	}

	public final IfExprContext ifExpr() throws RecognitionException {
		IfExprContext _localctx = new IfExprContext(_ctx, getState());
		enterRule(_localctx, 12, RULE_ifExpr);
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(147);
			ifPart();
			setState(151);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,8,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(148);
					elseIfPart();
					}
					} 
				}
				setState(153);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,8,_ctx);
			}
			setState(155);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,9,_ctx) ) {
			case 1:
				{
				setState(154);
				elsePart();
				}
				break;
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class IfPartContext extends ParserRuleContext {
		public TerminalNode LeftParen() { return getToken(ReportParserParser.LeftParen, 0); }
		public List<IfConditionContext> ifCondition() {
			return getRuleContexts(IfConditionContext.class);
		}
		public IfConditionContext ifCondition(int i) {
			return getRuleContext(IfConditionContext.class,i);
		}
		public TerminalNode RightParen() { return getToken(ReportParserParser.RightParen, 0); }
		public BlockContext block() {
			return getRuleContext(BlockContext.class,0);
		}
		public List<JoinContext> join() {
			return getRuleContexts(JoinContext.class);
		}
		public JoinContext join(int i) {
			return getRuleContext(JoinContext.class,i);
		}
		public IfPartContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_ifPart; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitIfPart(this);
			else return visitor.visitChildren(this);
		}
	}

	public final IfPartContext ifPart() throws RecognitionException {
		IfPartContext _localctx = new IfPartContext(_ctx, getState());
		enterRule(_localctx, 14, RULE_ifPart);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(157);
			match(T__4);
			setState(158);
			match(LeftParen);
			setState(159);
			ifCondition();
			setState(165);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==AND || _la==OR) {
				{
				{
				setState(160);
				join();
				setState(161);
				ifCondition();
				}
				}
				setState(167);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(168);
			match(RightParen);
			setState(169);
			match(T__2);
			setState(170);
			block();
			setState(171);
			match(T__3);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ElseIfPartContext extends ParserRuleContext {
		public TerminalNode LeftParen() { return getToken(ReportParserParser.LeftParen, 0); }
		public List<IfConditionContext> ifCondition() {
			return getRuleContexts(IfConditionContext.class);
		}
		public IfConditionContext ifCondition(int i) {
			return getRuleContext(IfConditionContext.class,i);
		}
		public TerminalNode RightParen() { return getToken(ReportParserParser.RightParen, 0); }
		public BlockContext block() {
			return getRuleContext(BlockContext.class,0);
		}
		public List<JoinContext> join() {
			return getRuleContexts(JoinContext.class);
		}
		public JoinContext join(int i) {
			return getRuleContext(JoinContext.class,i);
		}
		public ElseIfPartContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_elseIfPart; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitElseIfPart(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ElseIfPartContext elseIfPart() throws RecognitionException {
		ElseIfPartContext _localctx = new ElseIfPartContext(_ctx, getState());
		enterRule(_localctx, 16, RULE_elseIfPart);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(173);
			match(T__5);
			setState(174);
			match(T__4);
			setState(175);
			match(LeftParen);
			setState(176);
			ifCondition();
			setState(182);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==AND || _la==OR) {
				{
				{
				setState(177);
				join();
				setState(178);
				ifCondition();
				}
				}
				setState(184);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(185);
			match(RightParen);
			setState(186);
			match(T__2);
			setState(187);
			block();
			setState(188);
			match(T__3);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ElsePartContext extends ParserRuleContext {
		public BlockContext block() {
			return getRuleContext(BlockContext.class,0);
		}
		public ElsePartContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_elsePart; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitElsePart(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ElsePartContext elsePart() throws RecognitionException {
		ElsePartContext _localctx = new ElsePartContext(_ctx, getState());
		enterRule(_localctx, 18, RULE_elsePart);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(190);
			match(T__5);
			setState(191);
			match(T__2);
			setState(192);
			block();
			setState(193);
			match(T__3);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class BlockContext extends ParserRuleContext {
		public List<ExprBlockContext> exprBlock() {
			return getRuleContexts(ExprBlockContext.class);
		}
		public ExprBlockContext exprBlock(int i) {
			return getRuleContext(ExprBlockContext.class,i);
		}
		public ReturnExprContext returnExpr() {
			return getRuleContext(ReturnExprContext.class,0);
		}
		public BlockContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_block; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitBlock(this);
			else return visitor.visitChildren(this);
		}
	}

	public final BlockContext block() throws RecognitionException {
		BlockContext _localctx = new BlockContext(_ctx, getState());
		enterRule(_localctx, 20, RULE_block);
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(198);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,12,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(195);
					exprBlock();
					}
					} 
				}
				setState(200);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,12,_ctx);
			}
			setState(202);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,13,_ctx) ) {
			case 1:
				{
				setState(201);
				returnExpr();
				}
				break;
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ExprBlockContext extends ParserRuleContext {
		public VariableAssignContext variableAssign() {
			return getRuleContext(VariableAssignContext.class,0);
		}
		public IfExprContext ifExpr() {
			return getRuleContext(IfExprContext.class,0);
		}
		public CaseExprContext caseExpr() {
			return getRuleContext(CaseExprContext.class,0);
		}
		public ExprBlockContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_exprBlock; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitExprBlock(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ExprBlockContext exprBlock() throws RecognitionException {
		ExprBlockContext _localctx = new ExprBlockContext(_ctx, getState());
		enterRule(_localctx, 22, RULE_exprBlock);
		try {
			setState(207);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case T__8:
			case Identifier:
				enterOuterAlt(_localctx, 1);
				{
				setState(204);
				variableAssign();
				}
				break;
			case T__4:
				enterOuterAlt(_localctx, 2);
				{
				setState(205);
				ifExpr();
				}
				break;
			case T__1:
				enterOuterAlt(_localctx, 3);
				{
				setState(206);
				caseExpr();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ReturnExprContext extends ParserRuleContext {
		public ExprContext expr() {
			return getRuleContext(ExprContext.class,0);
		}
		public ReturnExprContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_returnExpr; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitReturnExpr(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ReturnExprContext returnExpr() throws RecognitionException {
		ReturnExprContext _localctx = new ReturnExprContext(_ctx, getState());
		enterRule(_localctx, 24, RULE_returnExpr);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(210);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==T__6) {
				{
				setState(209);
				match(T__6);
				}
			}

			setState(212);
			expr();
			setState(214);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,16,_ctx) ) {
			case 1:
				{
				setState(213);
				match(T__7);
				}
				break;
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ExprContext extends ParserRuleContext {
		public List<ItemContext> item() {
			return getRuleContexts(ItemContext.class);
		}
		public ItemContext item(int i) {
			return getRuleContext(ItemContext.class,i);
		}
		public List<TerminalNode> Operator() { return getTokens(ReportParserParser.Operator); }
		public TerminalNode Operator(int i) {
			return getToken(ReportParserParser.Operator, i);
		}
		public ExprContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_expr; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitExpr(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ExprContext expr() throws RecognitionException {
		ExprContext _localctx = new ExprContext(_ctx, getState());
		enterRule(_localctx, 26, RULE_expr);
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(216);
			item();
			setState(221);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,17,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(217);
					match(Operator);
					setState(218);
					item();
					}
					} 
				}
				setState(223);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,17,_ctx);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class IfConditionContext extends ParserRuleContext {
		public List<ExprContext> expr() {
			return getRuleContexts(ExprContext.class);
		}
		public ExprContext expr(int i) {
			return getRuleContext(ExprContext.class,i);
		}
		public TerminalNode OP() { return getToken(ReportParserParser.OP, 0); }
		public IfConditionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_ifCondition; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitIfCondition(this);
			else return visitor.visitChildren(this);
		}
	}

	public final IfConditionContext ifCondition() throws RecognitionException {
		IfConditionContext _localctx = new IfConditionContext(_ctx, getState());
		enterRule(_localctx, 28, RULE_ifCondition);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(224);
			expr();
			setState(225);
			match(OP);
			setState(226);
			expr();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class VariableAssignContext extends ParserRuleContext {
		public VariableContext variable() {
			return getRuleContext(VariableContext.class,0);
		}
		public ItemContext item() {
			return getRuleContext(ItemContext.class,0);
		}
		public VariableAssignContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_variableAssign; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitVariableAssign(this);
			else return visitor.visitChildren(this);
		}
	}

	public final VariableAssignContext variableAssign() throws RecognitionException {
		VariableAssignContext _localctx = new VariableAssignContext(_ctx, getState());
		enterRule(_localctx, 30, RULE_variableAssign);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(229);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==T__8) {
				{
				setState(228);
				match(T__8);
				}
			}

			setState(231);
			variable();
			setState(232);
			match(T__9);
			setState(233);
			item();
			setState(235);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,19,_ctx) ) {
			case 1:
				{
				setState(234);
				match(T__7);
				}
				break;
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ItemContext extends ParserRuleContext {
		public ItemContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_item; }
	 
		public ItemContext() { }
		public void copyFrom(ItemContext ctx) {
			super.copyFrom(ctx);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class SingleParenJoinContext extends ItemContext {
		public TerminalNode LeftParen() { return getToken(ReportParserParser.LeftParen, 0); }
		public ItemContext item() {
			return getRuleContext(ItemContext.class,0);
		}
		public TerminalNode RightParen() { return getToken(ReportParserParser.RightParen, 0); }
		public SingleParenJoinContext(ItemContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitSingleParenJoin(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class ParenJoinContext extends ItemContext {
		public TerminalNode LeftParen() { return getToken(ReportParserParser.LeftParen, 0); }
		public List<ItemContext> item() {
			return getRuleContexts(ItemContext.class);
		}
		public ItemContext item(int i) {
			return getRuleContext(ItemContext.class,i);
		}
		public TerminalNode RightParen() { return getToken(ReportParserParser.RightParen, 0); }
		public List<TerminalNode> Operator() { return getTokens(ReportParserParser.Operator); }
		public TerminalNode Operator(int i) {
			return getToken(ReportParserParser.Operator, i);
		}
		public ParenJoinContext(ItemContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitParenJoin(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class SimpleJoinContext extends ItemContext {
		public List<UnitContext> unit() {
			return getRuleContexts(UnitContext.class);
		}
		public UnitContext unit(int i) {
			return getRuleContext(UnitContext.class,i);
		}
		public List<TerminalNode> Operator() { return getTokens(ReportParserParser.Operator); }
		public TerminalNode Operator(int i) {
			return getToken(ReportParserParser.Operator, i);
		}
		public SimpleJoinContext(ItemContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitSimpleJoin(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ItemContext item() throws RecognitionException {
		ItemContext _localctx = new ItemContext(_ctx, getState());
		enterRule(_localctx, 32, RULE_item);
		int _la;
		try {
			int _alt;
			setState(259);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,22,_ctx) ) {
			case 1:
				_localctx = new SimpleJoinContext(_localctx);
				enterOuterAlt(_localctx, 1);
				{
				setState(237);
				unit();
				setState(242);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,20,_ctx);
				while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
					if ( _alt==1 ) {
						{
						{
						setState(238);
						match(Operator);
						setState(239);
						unit();
						}
						} 
					}
					setState(244);
					_errHandler.sync(this);
					_alt = getInterpreter().adaptivePredict(_input,20,_ctx);
				}
				}
				break;
			case 2:
				_localctx = new SingleParenJoinContext(_localctx);
				enterOuterAlt(_localctx, 2);
				{
				setState(245);
				match(LeftParen);
				setState(246);
				item();
				setState(247);
				match(RightParen);
				}
				break;
			case 3:
				_localctx = new ParenJoinContext(_localctx);
				enterOuterAlt(_localctx, 3);
				{
				setState(249);
				match(LeftParen);
				setState(250);
				item();
				setState(253); 
				_errHandler.sync(this);
				_la = _input.LA(1);
				do {
					{
					{
					setState(251);
					match(Operator);
					setState(252);
					item();
					}
					}
					setState(255); 
					_errHandler.sync(this);
					_la = _input.LA(1);
				} while ( _la==Operator );
				setState(257);
				match(RightParen);
				}
				break;
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class UnitContext extends ParserRuleContext {
		public DatasetContext dataset() {
			return getRuleContext(DatasetContext.class,0);
		}
		public FunctionContext function() {
			return getRuleContext(FunctionContext.class,0);
		}
		public SetContext set() {
			return getRuleContext(SetContext.class,0);
		}
		public CellPositionContext cellPosition() {
			return getRuleContext(CellPositionContext.class,0);
		}
		public RelativeCellContext relativeCell() {
			return getRuleContext(RelativeCellContext.class,0);
		}
		public CurrentCellValueContext currentCellValue() {
			return getRuleContext(CurrentCellValueContext.class,0);
		}
		public CurrentCellDataContext currentCellData() {
			return getRuleContext(CurrentCellDataContext.class,0);
		}
		public CellContext cell() {
			return getRuleContext(CellContext.class,0);
		}
		public VariableContext variable() {
			return getRuleContext(VariableContext.class,0);
		}
		public TerminalNode INTEGER() { return getToken(ReportParserParser.INTEGER, 0); }
		public TerminalNode BOOLEAN() { return getToken(ReportParserParser.BOOLEAN, 0); }
		public TerminalNode STRING() { return getToken(ReportParserParser.STRING, 0); }
		public TerminalNode NUMBER() { return getToken(ReportParserParser.NUMBER, 0); }
		public TerminalNode NULL() { return getToken(ReportParserParser.NULL, 0); }
		public UnitContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_unit; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitUnit(this);
			else return visitor.visitChildren(this);
		}
	}

	public final UnitContext unit() throws RecognitionException {
		UnitContext _localctx = new UnitContext(_ctx, getState());
		enterRule(_localctx, 34, RULE_unit);
		try {
			setState(275);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,23,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(261);
				dataset();
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(262);
				function();
				}
				break;
			case 3:
				enterOuterAlt(_localctx, 3);
				{
				setState(263);
				set(0);
				}
				break;
			case 4:
				enterOuterAlt(_localctx, 4);
				{
				setState(264);
				cellPosition();
				}
				break;
			case 5:
				enterOuterAlt(_localctx, 5);
				{
				setState(265);
				relativeCell();
				}
				break;
			case 6:
				enterOuterAlt(_localctx, 6);
				{
				setState(266);
				currentCellValue();
				}
				break;
			case 7:
				enterOuterAlt(_localctx, 7);
				{
				setState(267);
				currentCellData();
				}
				break;
			case 8:
				enterOuterAlt(_localctx, 8);
				{
				setState(268);
				cell();
				}
				break;
			case 9:
				enterOuterAlt(_localctx, 9);
				{
				setState(269);
				variable();
				}
				break;
			case 10:
				enterOuterAlt(_localctx, 10);
				{
				setState(270);
				match(INTEGER);
				}
				break;
			case 11:
				enterOuterAlt(_localctx, 11);
				{
				setState(271);
				match(BOOLEAN);
				}
				break;
			case 12:
				enterOuterAlt(_localctx, 12);
				{
				setState(272);
				match(STRING);
				}
				break;
			case 13:
				enterOuterAlt(_localctx, 13);
				{
				setState(273);
				match(NUMBER);
				}
				break;
			case 14:
				enterOuterAlt(_localctx, 14);
				{
				setState(274);
				match(NULL);
				}
				break;
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class VariableContext extends ParserRuleContext {
		public TerminalNode Identifier() { return getToken(ReportParserParser.Identifier, 0); }
		public VariableContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_variable; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitVariable(this);
			else return visitor.visitChildren(this);
		}
	}

	public final VariableContext variable() throws RecognitionException {
		VariableContext _localctx = new VariableContext(_ctx, getState());
		enterRule(_localctx, 36, RULE_variable);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(277);
			match(Identifier);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class CellPositionContext extends ParserRuleContext {
		public TerminalNode Cell() { return getToken(ReportParserParser.Cell, 0); }
		public CellPositionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_cellPosition; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCellPosition(this);
			else return visitor.visitChildren(this);
		}
	}

	public final CellPositionContext cellPosition() throws RecognitionException {
		CellPositionContext _localctx = new CellPositionContext(_ctx, getState());
		enterRule(_localctx, 38, RULE_cellPosition);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(279);
			match(T__10);
			setState(280);
			match(Cell);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class RelativeCellContext extends ParserRuleContext {
		public TerminalNode Cell() { return getToken(ReportParserParser.Cell, 0); }
		public RelativeCellContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_relativeCell; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitRelativeCell(this);
			else return visitor.visitChildren(this);
		}
	}

	public final RelativeCellContext relativeCell() throws RecognitionException {
		RelativeCellContext _localctx = new RelativeCellContext(_ctx, getState());
		enterRule(_localctx, 40, RULE_relativeCell);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(282);
			match(T__11);
			setState(283);
			match(Cell);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class CurrentCellValueContext extends ParserRuleContext {
		public CurrentCellValueContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_currentCellValue; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCurrentCellValue(this);
			else return visitor.visitChildren(this);
		}
	}

	public final CurrentCellValueContext currentCellValue() throws RecognitionException {
		CurrentCellValueContext _localctx = new CurrentCellValueContext(_ctx, getState());
		enterRule(_localctx, 42, RULE_currentCellValue);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(285);
			match(T__12);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class CurrentCellDataContext extends ParserRuleContext {
		public PropertyContext property() {
			return getRuleContext(PropertyContext.class,0);
		}
		public CurrentCellDataContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_currentCellData; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCurrentCellData(this);
			else return visitor.visitChildren(this);
		}
	}

	public final CurrentCellDataContext currentCellData() throws RecognitionException {
		CurrentCellDataContext _localctx = new CurrentCellDataContext(_ctx, getState());
		enterRule(_localctx, 44, RULE_currentCellData);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(287);
			match(T__12);
			setState(288);
			match(T__13);
			setState(289);
			property(0);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class CellContext extends ParserRuleContext {
		public PropertyContext property() {
			return getRuleContext(PropertyContext.class,0);
		}
		public CellContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_cell; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCell(this);
			else return visitor.visitChildren(this);
		}
	}

	public final CellContext cell() throws RecognitionException {
		CellContext _localctx = new CellContext(_ctx, getState());
		enterRule(_localctx, 46, RULE_cell);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(291);
			match(T__14);
			setState(294);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,24,_ctx) ) {
			case 1:
				{
				setState(292);
				match(T__13);
				setState(293);
				property(0);
				}
				break;
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class DatasetContext extends ParserRuleContext {
		public TerminalNode Identifier() { return getToken(ReportParserParser.Identifier, 0); }
		public AggregateContext aggregate() {
			return getRuleContext(AggregateContext.class,0);
		}
		public TerminalNode LeftParen() { return getToken(ReportParserParser.LeftParen, 0); }
		public TerminalNode RightParen() { return getToken(ReportParserParser.RightParen, 0); }
		public PropertyContext property() {
			return getRuleContext(PropertyContext.class,0);
		}
		public List<TerminalNode> COMMA() { return getTokens(ReportParserParser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(ReportParserParser.COMMA, i);
		}
		public ConditionsContext conditions() {
			return getRuleContext(ConditionsContext.class,0);
		}
		public TerminalNode ORDER() { return getToken(ReportParserParser.ORDER, 0); }
		public DatasetContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_dataset; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitDataset(this);
			else return visitor.visitChildren(this);
		}
	}

	public final DatasetContext dataset() throws RecognitionException {
		DatasetContext _localctx = new DatasetContext(_ctx, getState());
		enterRule(_localctx, 48, RULE_dataset);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(296);
			match(Identifier);
			setState(297);
			match(T__13);
			setState(298);
			aggregate();
			setState(299);
			match(LeftParen);
			setState(301);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==Identifier) {
				{
				setState(300);
				property(0);
				}
			}

			setState(305);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,26,_ctx) ) {
			case 1:
				{
				setState(303);
				match(COMMA);
				setState(304);
				conditions();
				}
				break;
			}
			setState(309);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==COMMA) {
				{
				setState(307);
				match(COMMA);
				setState(308);
				match(ORDER);
				}
			}

			setState(311);
			match(RightParen);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class FunctionContext extends ParserRuleContext {
		public TerminalNode Identifier() { return getToken(ReportParserParser.Identifier, 0); }
		public TerminalNode LeftParen() { return getToken(ReportParserParser.LeftParen, 0); }
		public TerminalNode RightParen() { return getToken(ReportParserParser.RightParen, 0); }
		public FunctionParameterContext functionParameter() {
			return getRuleContext(FunctionParameterContext.class,0);
		}
		public FunctionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_function; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitFunction(this);
			else return visitor.visitChildren(this);
		}
	}

	public final FunctionContext function() throws RecognitionException {
		FunctionContext _localctx = new FunctionContext(_ctx, getState());
		enterRule(_localctx, 50, RULE_function);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(313);
			match(Identifier);
			setState(314);
			match(LeftParen);
			setState(316);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if ((((_la) & ~0x3f) == 0 && ((1L << _la) & 164703025152L) != 0)) {
				{
				setState(315);
				functionParameter();
				}
			}

			setState(318);
			match(RightParen);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class FunctionParameterContext extends ParserRuleContext {
		public List<ItemContext> item() {
			return getRuleContexts(ItemContext.class);
		}
		public ItemContext item(int i) {
			return getRuleContext(ItemContext.class,i);
		}
		public List<TerminalNode> COMMA() { return getTokens(ReportParserParser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(ReportParserParser.COMMA, i);
		}
		public FunctionParameterContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_functionParameter; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitFunctionParameter(this);
			else return visitor.visitChildren(this);
		}
	}

	public final FunctionParameterContext functionParameter() throws RecognitionException {
		FunctionParameterContext _localctx = new FunctionParameterContext(_ctx, getState());
		enterRule(_localctx, 52, RULE_functionParameter);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(320);
			item();
			setState(327);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while ((((_la) & ~0x3f) == 0 && ((1L << _la) & 164770134016L) != 0)) {
				{
				{
				setState(322);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==COMMA) {
					{
					setState(321);
					match(COMMA);
					}
				}

				setState(324);
				item();
				}
				}
				setState(329);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class SetContext extends ParserRuleContext {
		public SetContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_set; }
	 
		public SetContext() { }
		public void copyFrom(SetContext ctx) {
			super.copyFrom(ctx);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class CellPairContext extends SetContext {
		public List<TerminalNode> Cell() { return getTokens(ReportParserParser.Cell); }
		public TerminalNode Cell(int i) {
			return getToken(ReportParserParser.Cell, i);
		}
		public TerminalNode COLON() { return getToken(ReportParserParser.COLON, 0); }
		public CellPairContext(SetContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCellPair(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class WholeCellContext extends SetContext {
		public TerminalNode Cell() { return getToken(ReportParserParser.Cell, 0); }
		public ConditionsContext conditions() {
			return getRuleContext(ConditionsContext.class,0);
		}
		public WholeCellContext(SetContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitWholeCell(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class CellCoordinateConditionContext extends SetContext {
		public TerminalNode Cell() { return getToken(ReportParserParser.Cell, 0); }
		public CellCoordinateContext cellCoordinate() {
			return getRuleContext(CellCoordinateContext.class,0);
		}
		public ConditionsContext conditions() {
			return getRuleContext(ConditionsContext.class,0);
		}
		public CellCoordinateConditionContext(SetContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCellCoordinateCondition(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class SingleCellConditionContext extends SetContext {
		public TerminalNode Cell() { return getToken(ReportParserParser.Cell, 0); }
		public ConditionsContext conditions() {
			return getRuleContext(ConditionsContext.class,0);
		}
		public SingleCellConditionContext(SetContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitSingleCellCondition(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class SingleCellContext extends SetContext {
		public TerminalNode Cell() { return getToken(ReportParserParser.Cell, 0); }
		public SingleCellContext(SetContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitSingleCell(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class SimpleDataContext extends SetContext {
		public SimpleValueContext simpleValue() {
			return getRuleContext(SimpleValueContext.class,0);
		}
		public SimpleDataContext(SetContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitSimpleData(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class RangeContext extends SetContext {
		public List<SetContext> set() {
			return getRuleContexts(SetContext.class);
		}
		public SetContext set(int i) {
			return getRuleContext(SetContext.class,i);
		}
		public RangeContext(SetContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitRange(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class SingleCellCoordinateContext extends SetContext {
		public TerminalNode Cell() { return getToken(ReportParserParser.Cell, 0); }
		public CellCoordinateContext cellCoordinate() {
			return getRuleContext(CellCoordinateContext.class,0);
		}
		public SingleCellCoordinateContext(SetContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitSingleCellCoordinate(this);
			else return visitor.visitChildren(this);
		}
	}

	public final SetContext set() throws RecognitionException {
		return set(0);
	}

	private SetContext set(int _p) throws RecognitionException {
		ParserRuleContext _parentctx = _ctx;
		int _parentState = getState();
		SetContext _localctx = new SetContext(_ctx, _parentState);
		SetContext _prevctx = _localctx;
		int _startState = 54;
		enterRecursionRule(_localctx, 54, RULE_set, _p);
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(363);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,32,_ctx) ) {
			case 1:
				{
				_localctx = new SimpleDataContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;

				setState(331);
				simpleValue();
				}
				break;
			case 2:
				{
				_localctx = new SingleCellContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(332);
				match(Cell);
				}
				break;
			case 3:
				{
				_localctx = new WholeCellContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(333);
				match(Cell);
				setState(334);
				match(T__15);
				setState(335);
				match(T__16);
				setState(340);
				_errHandler.sync(this);
				switch ( getInterpreter().adaptivePredict(_input,31,_ctx) ) {
				case 1:
					{
					setState(336);
					match(T__2);
					setState(337);
					conditions();
					setState(338);
					match(T__3);
					}
					break;
				}
				}
				break;
			case 4:
				{
				_localctx = new CellPairContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(342);
				match(Cell);
				setState(343);
				match(COLON);
				setState(344);
				match(Cell);
				}
				break;
			case 5:
				{
				_localctx = new SingleCellConditionContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(345);
				match(Cell);
				setState(346);
				match(T__2);
				setState(347);
				conditions();
				setState(348);
				match(T__3);
				}
				break;
			case 6:
				{
				_localctx = new SingleCellCoordinateContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(350);
				match(Cell);
				setState(351);
				match(T__15);
				setState(352);
				cellCoordinate();
				setState(353);
				match(T__16);
				}
				break;
			case 7:
				{
				_localctx = new CellCoordinateConditionContext(_localctx);
				_ctx = _localctx;
				_prevctx = _localctx;
				setState(355);
				match(Cell);
				setState(356);
				match(T__15);
				setState(357);
				cellCoordinate();
				setState(358);
				match(T__16);
				setState(359);
				match(T__2);
				setState(360);
				conditions();
				setState(361);
				match(T__3);
				}
				break;
			}
			_ctx.stop = _input.LT(-1);
			setState(370);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,33,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					if ( _parseListeners!=null ) triggerExitRuleEvent();
					_prevctx = _localctx;
					{
					{
					_localctx = new RangeContext(new SetContext(_parentctx, _parentState));
					pushNewRecursionContext(_localctx, _startState, RULE_set);
					setState(365);
					if (!(precpred(_ctx, 1))) throw new FailedPredicateException(this, "precpred(_ctx, 1)");
					setState(366);
					match(T__17);
					setState(367);
					set(2);
					}
					} 
				}
				setState(372);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,33,_ctx);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class CellCoordinateContext extends ParserRuleContext {
		public List<CoordinateContext> coordinate() {
			return getRuleContexts(CoordinateContext.class);
		}
		public CoordinateContext coordinate(int i) {
			return getRuleContext(CoordinateContext.class,i);
		}
		public CellCoordinateContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_cellCoordinate; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCellCoordinate(this);
			else return visitor.visitChildren(this);
		}
	}

	public final CellCoordinateContext cellCoordinate() throws RecognitionException {
		CellCoordinateContext _localctx = new CellCoordinateContext(_ctx, getState());
		enterRule(_localctx, 56, RULE_cellCoordinate);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(373);
			coordinate();
			setState(376);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==T__7) {
				{
				setState(374);
				match(T__7);
				setState(375);
				coordinate();
				}
			}

			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class CoordinateContext extends ParserRuleContext {
		public List<CellIndicatorContext> cellIndicator() {
			return getRuleContexts(CellIndicatorContext.class);
		}
		public CellIndicatorContext cellIndicator(int i) {
			return getRuleContext(CellIndicatorContext.class,i);
		}
		public List<TerminalNode> COMMA() { return getTokens(ReportParserParser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(ReportParserParser.COMMA, i);
		}
		public CoordinateContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_coordinate; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCoordinate(this);
			else return visitor.visitChildren(this);
		}
	}

	public final CoordinateContext coordinate() throws RecognitionException {
		CoordinateContext _localctx = new CoordinateContext(_ctx, getState());
		enterRule(_localctx, 58, RULE_coordinate);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(378);
			cellIndicator();
			setState(383);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==COMMA) {
				{
				{
				setState(379);
				match(COMMA);
				setState(380);
				cellIndicator();
				}
				}
				setState(385);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class CellIndicatorContext extends ParserRuleContext {
		public CellIndicatorContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_cellIndicator; }
	 
		public CellIndicatorContext() { }
		public void copyFrom(CellIndicatorContext ctx) {
			super.copyFrom(ctx);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class AbsoluteContext extends CellIndicatorContext {
		public TerminalNode Cell() { return getToken(ReportParserParser.Cell, 0); }
		public TerminalNode COLON() { return getToken(ReportParserParser.COLON, 0); }
		public TerminalNode INTEGER() { return getToken(ReportParserParser.INTEGER, 0); }
		public TerminalNode EXCLAMATION() { return getToken(ReportParserParser.EXCLAMATION, 0); }
		public AbsoluteContext(CellIndicatorContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitAbsolute(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class RelativeContext extends CellIndicatorContext {
		public TerminalNode Cell() { return getToken(ReportParserParser.Cell, 0); }
		public RelativeContext(CellIndicatorContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitRelative(this);
			else return visitor.visitChildren(this);
		}
	}

	public final CellIndicatorContext cellIndicator() throws RecognitionException {
		CellIndicatorContext _localctx = new CellIndicatorContext(_ctx, getState());
		enterRule(_localctx, 60, RULE_cellIndicator);
		int _la;
		try {
			setState(393);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,37,_ctx) ) {
			case 1:
				_localctx = new RelativeContext(_localctx);
				enterOuterAlt(_localctx, 1);
				{
				setState(386);
				match(Cell);
				}
				break;
			case 2:
				_localctx = new AbsoluteContext(_localctx);
				enterOuterAlt(_localctx, 2);
				{
				setState(387);
				match(Cell);
				setState(388);
				match(COLON);
				setState(390);
				_errHandler.sync(this);
				_la = _input.LA(1);
				if (_la==EXCLAMATION) {
					{
					setState(389);
					match(EXCLAMATION);
					}
				}

				setState(392);
				match(INTEGER);
				}
				break;
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ConditionsContext extends ParserRuleContext {
		public List<ConditionContext> condition() {
			return getRuleContexts(ConditionContext.class);
		}
		public ConditionContext condition(int i) {
			return getRuleContext(ConditionContext.class,i);
		}
		public List<JoinContext> join() {
			return getRuleContexts(JoinContext.class);
		}
		public JoinContext join(int i) {
			return getRuleContext(JoinContext.class,i);
		}
		public ConditionsContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_conditions; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitConditions(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ConditionsContext conditions() throws RecognitionException {
		ConditionsContext _localctx = new ConditionsContext(_ctx, getState());
		enterRule(_localctx, 62, RULE_conditions);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(395);
			condition();
			setState(401);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==AND || _la==OR) {
				{
				{
				setState(396);
				join();
				setState(397);
				condition();
				}
				}
				setState(403);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class ConditionContext extends ParserRuleContext {
		public ConditionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_condition; }
	 
		public ConditionContext() { }
		public void copyFrom(ConditionContext ctx) {
			super.copyFrom(ctx);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class ExprConditionContext extends ConditionContext {
		public List<ExprContext> expr() {
			return getRuleContexts(ExprContext.class);
		}
		public ExprContext expr(int i) {
			return getRuleContext(ExprContext.class,i);
		}
		public TerminalNode OP() { return getToken(ReportParserParser.OP, 0); }
		public ExprConditionContext(ConditionContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitExprCondition(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class CurrentValueConditionContext extends ConditionContext {
		public CurrentValueContext currentValue() {
			return getRuleContext(CurrentValueContext.class,0);
		}
		public TerminalNode OP() { return getToken(ReportParserParser.OP, 0); }
		public ExprContext expr() {
			return getRuleContext(ExprContext.class,0);
		}
		public CurrentValueConditionContext(ConditionContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCurrentValueCondition(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class PropertyConditionContext extends ConditionContext {
		public PropertyContext property() {
			return getRuleContext(PropertyContext.class,0);
		}
		public TerminalNode OP() { return getToken(ReportParserParser.OP, 0); }
		public ExprContext expr() {
			return getRuleContext(ExprContext.class,0);
		}
		public PropertyConditionContext(ConditionContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitPropertyCondition(this);
			else return visitor.visitChildren(this);
		}
	}
	@SuppressWarnings("CheckReturnValue")
	public static class CellNameExprConditionContext extends ConditionContext {
		public TerminalNode Cell() { return getToken(ReportParserParser.Cell, 0); }
		public TerminalNode OP() { return getToken(ReportParserParser.OP, 0); }
		public ExprContext expr() {
			return getRuleContext(ExprContext.class,0);
		}
		public CellNameExprConditionContext(ConditionContext ctx) { copyFrom(ctx); }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCellNameExprCondition(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ConditionContext condition() throws RecognitionException {
		ConditionContext _localctx = new ConditionContext(_ctx, getState());
		enterRule(_localctx, 64, RULE_condition);
		try {
			setState(419);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,39,_ctx) ) {
			case 1:
				_localctx = new CellNameExprConditionContext(_localctx);
				enterOuterAlt(_localctx, 1);
				{
				setState(404);
				match(Cell);
				setState(405);
				match(OP);
				setState(406);
				expr();
				}
				break;
			case 2:
				_localctx = new PropertyConditionContext(_localctx);
				enterOuterAlt(_localctx, 2);
				{
				setState(407);
				property(0);
				setState(408);
				match(OP);
				setState(409);
				expr();
				}
				break;
			case 3:
				_localctx = new CurrentValueConditionContext(_localctx);
				enterOuterAlt(_localctx, 3);
				{
				setState(411);
				currentValue();
				setState(412);
				match(OP);
				setState(413);
				expr();
				}
				break;
			case 4:
				_localctx = new ExprConditionContext(_localctx);
				enterOuterAlt(_localctx, 4);
				{
				setState(415);
				expr();
				setState(416);
				match(OP);
				setState(417);
				expr();
				}
				break;
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class PropertyContext extends ParserRuleContext {
		public TerminalNode Identifier() { return getToken(ReportParserParser.Identifier, 0); }
		public List<PropertyContext> property() {
			return getRuleContexts(PropertyContext.class);
		}
		public PropertyContext property(int i) {
			return getRuleContext(PropertyContext.class,i);
		}
		public PropertyContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_property; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitProperty(this);
			else return visitor.visitChildren(this);
		}
	}

	public final PropertyContext property() throws RecognitionException {
		return property(0);
	}

	private PropertyContext property(int _p) throws RecognitionException {
		ParserRuleContext _parentctx = _ctx;
		int _parentState = getState();
		PropertyContext _localctx = new PropertyContext(_ctx, _parentState);
		PropertyContext _prevctx = _localctx;
		int _startState = 66;
		enterRecursionRule(_localctx, 66, RULE_property, _p);
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			{
			setState(422);
			match(Identifier);
			}
			_ctx.stop = _input.LT(-1);
			setState(429);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,40,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					if ( _parseListeners!=null ) triggerExitRuleEvent();
					_prevctx = _localctx;
					{
					{
					_localctx = new PropertyContext(_parentctx, _parentState);
					pushNewRecursionContext(_localctx, _startState, RULE_property);
					setState(424);
					if (!(precpred(_ctx, 1))) throw new FailedPredicateException(this, "precpred(_ctx, 1)");
					setState(425);
					match(T__13);
					setState(426);
					property(2);
					}
					} 
				}
				setState(431);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,40,_ctx);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class CurrentValueContext extends ParserRuleContext {
		public CurrentValueContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_currentValue; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitCurrentValue(this);
			else return visitor.visitChildren(this);
		}
	}

	public final CurrentValueContext currentValue() throws RecognitionException {
		CurrentValueContext _localctx = new CurrentValueContext(_ctx, getState());
		enterRule(_localctx, 68, RULE_currentValue);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(432);
			match(T__18);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class SimpleValueContext extends ParserRuleContext {
		public TerminalNode INTEGER() { return getToken(ReportParserParser.INTEGER, 0); }
		public TerminalNode NUMBER() { return getToken(ReportParserParser.NUMBER, 0); }
		public TerminalNode STRING() { return getToken(ReportParserParser.STRING, 0); }
		public TerminalNode BOOLEAN() { return getToken(ReportParserParser.BOOLEAN, 0); }
		public TerminalNode NULL() { return getToken(ReportParserParser.NULL, 0); }
		public SimpleValueContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_simpleValue; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitSimpleValue(this);
			else return visitor.visitChildren(this);
		}
	}

	public final SimpleValueContext simpleValue() throws RecognitionException {
		SimpleValueContext _localctx = new SimpleValueContext(_ctx, getState());
		enterRule(_localctx, 70, RULE_simpleValue);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(434);
			_la = _input.LA(1);
			if ( !((((_la) & ~0x3f) == 0 && ((1L << _la) & 26994540544L) != 0)) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class JoinContext extends ParserRuleContext {
		public TerminalNode AND() { return getToken(ReportParserParser.AND, 0); }
		public TerminalNode OR() { return getToken(ReportParserParser.OR, 0); }
		public JoinContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_join; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitJoin(this);
			else return visitor.visitChildren(this);
		}
	}

	public final JoinContext join() throws RecognitionException {
		JoinContext _localctx = new JoinContext(_ctx, getState());
		enterRule(_localctx, 72, RULE_join);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(436);
			_la = _input.LA(1);
			if ( !(_la==AND || _la==OR) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	@SuppressWarnings("CheckReturnValue")
	public static class AggregateContext extends ParserRuleContext {
		public TerminalNode Identifier() { return getToken(ReportParserParser.Identifier, 0); }
		public AggregateContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_aggregate; }
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof ReportParserVisitor ) return ((ReportParserVisitor<? extends T>)visitor).visitAggregate(this);
			else return visitor.visitChildren(this);
		}
	}

	public final AggregateContext aggregate() throws RecognitionException {
		AggregateContext _localctx = new AggregateContext(_ctx, getState());
		enterRule(_localctx, 74, RULE_aggregate);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(438);
			match(Identifier);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public boolean sempred(RuleContext _localctx, int ruleIndex, int predIndex) {
		switch (ruleIndex) {
		case 2:
			return exprComposite_sempred((ExprCompositeContext)_localctx, predIndex);
		case 27:
			return set_sempred((SetContext)_localctx, predIndex);
		case 33:
			return property_sempred((PropertyContext)_localctx, predIndex);
		}
		return true;
	}
	private boolean exprComposite_sempred(ExprCompositeContext _localctx, int predIndex) {
		switch (predIndex) {
		case 0:
			return precpred(_ctx, 1);
		}
		return true;
	}
	private boolean set_sempred(SetContext _localctx, int predIndex) {
		switch (predIndex) {
		case 1:
			return precpred(_ctx, 1);
		}
		return true;
	}
	private boolean property_sempred(PropertyContext _localctx, int predIndex) {
		switch (predIndex) {
		case 2:
			return precpred(_ctx, 1);
		}
		return true;
	}

	public static final String _serializedATN =
		"\u0004\u0001*\u01b9\u0002\u0000\u0007\u0000\u0002\u0001\u0007\u0001\u0002"+
		"\u0002\u0007\u0002\u0002\u0003\u0007\u0003\u0002\u0004\u0007\u0004\u0002"+
		"\u0005\u0007\u0005\u0002\u0006\u0007\u0006\u0002\u0007\u0007\u0007\u0002"+
		"\b\u0007\b\u0002\t\u0007\t\u0002\n\u0007\n\u0002\u000b\u0007\u000b\u0002"+
		"\f\u0007\f\u0002\r\u0007\r\u0002\u000e\u0007\u000e\u0002\u000f\u0007\u000f"+
		"\u0002\u0010\u0007\u0010\u0002\u0011\u0007\u0011\u0002\u0012\u0007\u0012"+
		"\u0002\u0013\u0007\u0013\u0002\u0014\u0007\u0014\u0002\u0015\u0007\u0015"+
		"\u0002\u0016\u0007\u0016\u0002\u0017\u0007\u0017\u0002\u0018\u0007\u0018"+
		"\u0002\u0019\u0007\u0019\u0002\u001a\u0007\u001a\u0002\u001b\u0007\u001b"+
		"\u0002\u001c\u0007\u001c\u0002\u001d\u0007\u001d\u0002\u001e\u0007\u001e"+
		"\u0002\u001f\u0007\u001f\u0002 \u0007 \u0002!\u0007!\u0002\"\u0007\"\u0002"+
		"#\u0007#\u0002$\u0007$\u0002%\u0007%\u0001\u0000\u0004\u0000N\b\u0000"+
		"\u000b\u0000\f\u0000O\u0001\u0000\u0001\u0000\u0001\u0001\u0001\u0001"+
		"\u0001\u0001\u0001\u0001\u0001\u0001\u0003\u0001Y\b\u0001\u0001\u0002"+
		"\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002"+
		"\u0003\u0002b\b\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0005\u0002"+
		"g\b\u0002\n\u0002\f\u0002j\t\u0002\u0001\u0003\u0001\u0003\u0001\u0003"+
		"\u0001\u0003\u0005\u0003p\b\u0003\n\u0003\f\u0003s\t\u0003\u0001\u0003"+
		"\u0001\u0003\u0001\u0003\u0001\u0003\u0001\u0003\u0001\u0004\u0001\u0004"+
		"\u0001\u0004\u0001\u0004\u0001\u0004\u0005\u0004\u007f\b\u0004\n\u0004"+
		"\f\u0004\u0082\t\u0004\u0001\u0004\u0001\u0004\u0001\u0005\u0001\u0005"+
		"\u0001\u0005\u0001\u0005\u0005\u0005\u008a\b\u0005\n\u0005\f\u0005\u008d"+
		"\t\u0005\u0001\u0005\u0003\u0005\u0090\b\u0005\u0001\u0005\u0001\u0005"+
		"\u0001\u0006\u0001\u0006\u0005\u0006\u0096\b\u0006\n\u0006\f\u0006\u0099"+
		"\t\u0006\u0001\u0006\u0003\u0006\u009c\b\u0006\u0001\u0007\u0001\u0007"+
		"\u0001\u0007\u0001\u0007\u0001\u0007\u0001\u0007\u0005\u0007\u00a4\b\u0007"+
		"\n\u0007\f\u0007\u00a7\t\u0007\u0001\u0007\u0001\u0007\u0001\u0007\u0001"+
		"\u0007\u0001\u0007\u0001\b\u0001\b\u0001\b\u0001\b\u0001\b\u0001\b\u0001"+
		"\b\u0005\b\u00b5\b\b\n\b\f\b\u00b8\t\b\u0001\b\u0001\b\u0001\b\u0001\b"+
		"\u0001\b\u0001\t\u0001\t\u0001\t\u0001\t\u0001\t\u0001\n\u0005\n\u00c5"+
		"\b\n\n\n\f\n\u00c8\t\n\u0001\n\u0003\n\u00cb\b\n\u0001\u000b\u0001\u000b"+
		"\u0001\u000b\u0003\u000b\u00d0\b\u000b\u0001\f\u0003\f\u00d3\b\f\u0001"+
		"\f\u0001\f\u0003\f\u00d7\b\f\u0001\r\u0001\r\u0001\r\u0005\r\u00dc\b\r"+
		"\n\r\f\r\u00df\t\r\u0001\u000e\u0001\u000e\u0001\u000e\u0001\u000e\u0001"+
		"\u000f\u0003\u000f\u00e6\b\u000f\u0001\u000f\u0001\u000f\u0001\u000f\u0001"+
		"\u000f\u0003\u000f\u00ec\b\u000f\u0001\u0010\u0001\u0010\u0001\u0010\u0005"+
		"\u0010\u00f1\b\u0010\n\u0010\f\u0010\u00f4\t\u0010\u0001\u0010\u0001\u0010"+
		"\u0001\u0010\u0001\u0010\u0001\u0010\u0001\u0010\u0001\u0010\u0001\u0010"+
		"\u0004\u0010\u00fe\b\u0010\u000b\u0010\f\u0010\u00ff\u0001\u0010\u0001"+
		"\u0010\u0003\u0010\u0104\b\u0010\u0001\u0011\u0001\u0011\u0001\u0011\u0001"+
		"\u0011\u0001\u0011\u0001\u0011\u0001\u0011\u0001\u0011\u0001\u0011\u0001"+
		"\u0011\u0001\u0011\u0001\u0011\u0001\u0011\u0001\u0011\u0003\u0011\u0114"+
		"\b\u0011\u0001\u0012\u0001\u0012\u0001\u0013\u0001\u0013\u0001\u0013\u0001"+
		"\u0014\u0001\u0014\u0001\u0014\u0001\u0015\u0001\u0015\u0001\u0016\u0001"+
		"\u0016\u0001\u0016\u0001\u0016\u0001\u0017\u0001\u0017\u0001\u0017\u0003"+
		"\u0017\u0127\b\u0017\u0001\u0018\u0001\u0018\u0001\u0018\u0001\u0018\u0001"+
		"\u0018\u0003\u0018\u012e\b\u0018\u0001\u0018\u0001\u0018\u0003\u0018\u0132"+
		"\b\u0018\u0001\u0018\u0001\u0018\u0003\u0018\u0136\b\u0018\u0001\u0018"+
		"\u0001\u0018\u0001\u0019\u0001\u0019\u0001\u0019\u0003\u0019\u013d\b\u0019"+
		"\u0001\u0019\u0001\u0019\u0001\u001a\u0001\u001a\u0003\u001a\u0143\b\u001a"+
		"\u0001\u001a\u0005\u001a\u0146\b\u001a\n\u001a\f\u001a\u0149\t\u001a\u0001"+
		"\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001"+
		"\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0003\u001b\u0155\b\u001b\u0001"+
		"\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001"+
		"\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001"+
		"\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001\u001b\u0001"+
		"\u001b\u0001\u001b\u0001\u001b\u0003\u001b\u016c\b\u001b\u0001\u001b\u0001"+
		"\u001b\u0001\u001b\u0005\u001b\u0171\b\u001b\n\u001b\f\u001b\u0174\t\u001b"+
		"\u0001\u001c\u0001\u001c\u0001\u001c\u0003\u001c\u0179\b\u001c\u0001\u001d"+
		"\u0001\u001d\u0001\u001d\u0005\u001d\u017e\b\u001d\n\u001d\f\u001d\u0181"+
		"\t\u001d\u0001\u001e\u0001\u001e\u0001\u001e\u0001\u001e\u0003\u001e\u0187"+
		"\b\u001e\u0001\u001e\u0003\u001e\u018a\b\u001e\u0001\u001f\u0001\u001f"+
		"\u0001\u001f\u0001\u001f\u0005\u001f\u0190\b\u001f\n\u001f\f\u001f\u0193"+
		"\t\u001f\u0001 \u0001 \u0001 \u0001 \u0001 \u0001 \u0001 \u0001 \u0001"+
		" \u0001 \u0001 \u0001 \u0001 \u0001 \u0001 \u0003 \u01a4\b \u0001!\u0001"+
		"!\u0001!\u0001!\u0001!\u0001!\u0005!\u01ac\b!\n!\f!\u01af\t!\u0001\"\u0001"+
		"\"\u0001#\u0001#\u0001$\u0001$\u0001%\u0001%\u0001%\u0000\u0003\u0004"+
		"6B&\u0000\u0002\u0004\u0006\b\n\f\u000e\u0010\u0012\u0014\u0016\u0018"+
		"\u001a\u001c\u001e \"$&(*,.02468:<>@BDFHJ\u0000\u0002\u0004\u0000\u0018"+
		"\u0018\u001b\u001b\u001e\u001e!\"\u0001\u0000\u001f \u01d4\u0000M\u0001"+
		"\u0000\u0000\u0000\u0002X\u0001\u0000\u0000\u0000\u0004a\u0001\u0000\u0000"+
		"\u0000\u0006k\u0001\u0000\u0000\u0000\by\u0001\u0000\u0000\u0000\n\u0085"+
		"\u0001\u0000\u0000\u0000\f\u0093\u0001\u0000\u0000\u0000\u000e\u009d\u0001"+
		"\u0000\u0000\u0000\u0010\u00ad\u0001\u0000\u0000\u0000\u0012\u00be\u0001"+
		"\u0000\u0000\u0000\u0014\u00c6\u0001\u0000\u0000\u0000\u0016\u00cf\u0001"+
		"\u0000\u0000\u0000\u0018\u00d2\u0001\u0000\u0000\u0000\u001a\u00d8\u0001"+
		"\u0000\u0000\u0000\u001c\u00e0\u0001\u0000\u0000\u0000\u001e\u00e5\u0001"+
		"\u0000\u0000\u0000 \u0103\u0001\u0000\u0000\u0000\"\u0113\u0001\u0000"+
		"\u0000\u0000$\u0115\u0001\u0000\u0000\u0000&\u0117\u0001\u0000\u0000\u0000"+
		"(\u011a\u0001\u0000\u0000\u0000*\u011d\u0001\u0000\u0000\u0000,\u011f"+
		"\u0001\u0000\u0000\u0000.\u0123\u0001\u0000\u0000\u00000\u0128\u0001\u0000"+
		"\u0000\u00002\u0139\u0001\u0000\u0000\u00004\u0140\u0001\u0000\u0000\u0000"+
		"6\u016b\u0001\u0000\u0000\u00008\u0175\u0001\u0000\u0000\u0000:\u017a"+
		"\u0001\u0000\u0000\u0000<\u0189\u0001\u0000\u0000\u0000>\u018b\u0001\u0000"+
		"\u0000\u0000@\u01a3\u0001\u0000\u0000\u0000B\u01a5\u0001\u0000\u0000\u0000"+
		"D\u01b0\u0001\u0000\u0000\u0000F\u01b2\u0001\u0000\u0000\u0000H\u01b4"+
		"\u0001\u0000\u0000\u0000J\u01b6\u0001\u0000\u0000\u0000LN\u0003\u0002"+
		"\u0001\u0000ML\u0001\u0000\u0000\u0000NO\u0001\u0000\u0000\u0000OM\u0001"+
		"\u0000\u0000\u0000OP\u0001\u0000\u0000\u0000PQ\u0001\u0000\u0000\u0000"+
		"QR\u0005\u0000\u0000\u0001R\u0001\u0001\u0000\u0000\u0000SY\u0003\u0004"+
		"\u0002\u0000TY\u0003\f\u0006\u0000UY\u0003\b\u0004\u0000VY\u0003\u0018"+
		"\f\u0000WY\u0003\u001e\u000f\u0000XS\u0001\u0000\u0000\u0000XT\u0001\u0000"+
		"\u0000\u0000XU\u0001\u0000\u0000\u0000XV\u0001\u0000\u0000\u0000XW\u0001"+
		"\u0000\u0000\u0000Y\u0003\u0001\u0000\u0000\u0000Z[\u0006\u0002\uffff"+
		"\uffff\u0000[b\u0003\u001a\r\u0000\\b\u0003\u0006\u0003\u0000]^\u0005"+
		"\u001c\u0000\u0000^_\u0003\u0004\u0002\u0000_`\u0005\u001d\u0000\u0000"+
		"`b\u0001\u0000\u0000\u0000aZ\u0001\u0000\u0000\u0000a\\\u0001\u0000\u0000"+
		"\u0000a]\u0001\u0000\u0000\u0000bh\u0001\u0000\u0000\u0000cd\n\u0001\u0000"+
		"\u0000de\u0005\u0015\u0000\u0000eg\u0003\u0004\u0002\u0002fc\u0001\u0000"+
		"\u0000\u0000gj\u0001\u0000\u0000\u0000hf\u0001\u0000\u0000\u0000hi\u0001"+
		"\u0000\u0000\u0000i\u0005\u0001\u0000\u0000\u0000jh\u0001\u0000\u0000"+
		"\u0000kq\u0003\u001c\u000e\u0000lm\u0003H$\u0000mn\u0003\u001c\u000e\u0000"+
		"np\u0001\u0000\u0000\u0000ol\u0001\u0000\u0000\u0000ps\u0001\u0000\u0000"+
		"\u0000qo\u0001\u0000\u0000\u0000qr\u0001\u0000\u0000\u0000rt\u0001\u0000"+
		"\u0000\u0000sq\u0001\u0000\u0000\u0000tu\u0005\u0001\u0000\u0000uv\u0003"+
		"\u0014\n\u0000vw\u0005\u0019\u0000\u0000wx\u0003\u0014\n\u0000x\u0007"+
		"\u0001\u0000\u0000\u0000yz\u0005\u0002\u0000\u0000z{\u0005\u0003\u0000"+
		"\u0000{\u0080\u0003\n\u0005\u0000|}\u0005\u001a\u0000\u0000}\u007f\u0003"+
		"\n\u0005\u0000~|\u0001\u0000\u0000\u0000\u007f\u0082\u0001\u0000\u0000"+
		"\u0000\u0080~\u0001\u0000\u0000\u0000\u0080\u0081\u0001\u0000\u0000\u0000"+
		"\u0081\u0083\u0001\u0000\u0000\u0000\u0082\u0080\u0001\u0000\u0000\u0000"+
		"\u0083\u0084\u0005\u0004\u0000\u0000\u0084\t\u0001\u0000\u0000\u0000\u0085"+
		"\u008b\u0003\u001c\u000e\u0000\u0086\u0087\u0003H$\u0000\u0087\u0088\u0003"+
		"\u001c\u000e\u0000\u0088\u008a\u0001\u0000\u0000\u0000\u0089\u0086\u0001"+
		"\u0000\u0000\u0000\u008a\u008d\u0001\u0000\u0000\u0000\u008b\u0089\u0001"+
		"\u0000\u0000\u0000\u008b\u008c\u0001\u0000\u0000\u0000\u008c\u008f\u0001"+
		"\u0000\u0000\u0000\u008d\u008b\u0001\u0000\u0000\u0000\u008e\u0090\u0005"+
		"\u0019\u0000\u0000\u008f\u008e\u0001\u0000\u0000\u0000\u008f\u0090\u0001"+
		"\u0000\u0000\u0000\u0090\u0091\u0001\u0000\u0000\u0000\u0091\u0092\u0003"+
		"\u0014\n\u0000\u0092\u000b\u0001\u0000\u0000\u0000\u0093\u0097\u0003\u000e"+
		"\u0007\u0000\u0094\u0096\u0003\u0010\b\u0000\u0095\u0094\u0001\u0000\u0000"+
		"\u0000\u0096\u0099\u0001\u0000\u0000\u0000\u0097\u0095\u0001\u0000\u0000"+
		"\u0000\u0097\u0098\u0001\u0000\u0000\u0000\u0098\u009b\u0001\u0000\u0000"+
		"\u0000\u0099\u0097\u0001\u0000\u0000\u0000\u009a\u009c\u0003\u0012\t\u0000"+
		"\u009b\u009a\u0001\u0000\u0000\u0000\u009b\u009c\u0001\u0000\u0000\u0000"+
		"\u009c\r\u0001\u0000\u0000\u0000\u009d\u009e\u0005\u0005\u0000\u0000\u009e"+
		"\u009f\u0005\u001c\u0000\u0000\u009f\u00a5\u0003\u001c\u000e\u0000\u00a0"+
		"\u00a1\u0003H$\u0000\u00a1\u00a2\u0003\u001c\u000e\u0000\u00a2\u00a4\u0001"+
		"\u0000\u0000\u0000\u00a3\u00a0\u0001\u0000\u0000\u0000\u00a4\u00a7\u0001"+
		"\u0000\u0000\u0000\u00a5\u00a3\u0001\u0000\u0000\u0000\u00a5\u00a6\u0001"+
		"\u0000\u0000\u0000\u00a6\u00a8\u0001\u0000\u0000\u0000\u00a7\u00a5\u0001"+
		"\u0000\u0000\u0000\u00a8\u00a9\u0005\u001d\u0000\u0000\u00a9\u00aa\u0005"+
		"\u0003\u0000\u0000\u00aa\u00ab\u0003\u0014\n\u0000\u00ab\u00ac\u0005\u0004"+
		"\u0000\u0000\u00ac\u000f\u0001\u0000\u0000\u0000\u00ad\u00ae\u0005\u0006"+
		"\u0000\u0000\u00ae\u00af\u0005\u0005\u0000\u0000\u00af\u00b0\u0005\u001c"+
		"\u0000\u0000\u00b0\u00b6\u0003\u001c\u000e\u0000\u00b1\u00b2\u0003H$\u0000"+
		"\u00b2\u00b3\u0003\u001c\u000e\u0000\u00b3\u00b5\u0001\u0000\u0000\u0000"+
		"\u00b4\u00b1\u0001\u0000\u0000\u0000\u00b5\u00b8\u0001\u0000\u0000\u0000"+
		"\u00b6\u00b4\u0001\u0000\u0000\u0000\u00b6\u00b7\u0001\u0000\u0000\u0000"+
		"\u00b7\u00b9\u0001\u0000\u0000\u0000\u00b8\u00b6\u0001\u0000\u0000\u0000"+
		"\u00b9\u00ba\u0005\u001d\u0000\u0000\u00ba\u00bb\u0005\u0003\u0000\u0000"+
		"\u00bb\u00bc\u0003\u0014\n\u0000\u00bc\u00bd\u0005\u0004\u0000\u0000\u00bd"+
		"\u0011\u0001\u0000\u0000\u0000\u00be\u00bf\u0005\u0006\u0000\u0000\u00bf"+
		"\u00c0\u0005\u0003\u0000\u0000\u00c0\u00c1\u0003\u0014\n\u0000\u00c1\u00c2"+
		"\u0005\u0004\u0000\u0000\u00c2\u0013\u0001\u0000\u0000\u0000\u00c3\u00c5"+
		"\u0003\u0016\u000b\u0000\u00c4\u00c3\u0001\u0000\u0000\u0000\u00c5\u00c8"+
		"\u0001\u0000\u0000\u0000\u00c6\u00c4\u0001\u0000\u0000\u0000\u00c6\u00c7"+
		"\u0001\u0000\u0000\u0000\u00c7\u00ca\u0001\u0000\u0000\u0000\u00c8\u00c6"+
		"\u0001\u0000\u0000\u0000\u00c9\u00cb\u0003\u0018\f\u0000\u00ca\u00c9\u0001"+
		"\u0000\u0000\u0000\u00ca\u00cb\u0001\u0000\u0000\u0000\u00cb\u0015\u0001"+
		"\u0000\u0000\u0000\u00cc\u00d0\u0003\u001e\u000f\u0000\u00cd\u00d0\u0003"+
		"\f\u0006\u0000\u00ce\u00d0\u0003\b\u0004\u0000\u00cf\u00cc\u0001\u0000"+
		"\u0000\u0000\u00cf\u00cd\u0001\u0000\u0000\u0000\u00cf\u00ce\u0001\u0000"+
		"\u0000\u0000\u00d0\u0017\u0001\u0000\u0000\u0000\u00d1\u00d3\u0005\u0007"+
		"\u0000\u0000\u00d2\u00d1\u0001\u0000\u0000\u0000\u00d2\u00d3\u0001\u0000"+
		"\u0000\u0000\u00d3\u00d4\u0001\u0000\u0000\u0000\u00d4\u00d6\u0003\u001a"+
		"\r\u0000\u00d5\u00d7\u0005\b\u0000\u0000\u00d6\u00d5\u0001\u0000\u0000"+
		"\u0000\u00d6\u00d7\u0001\u0000\u0000\u0000\u00d7\u0019\u0001\u0000\u0000"+
		"\u0000\u00d8\u00dd\u0003 \u0010\u0000\u00d9\u00da\u0005\u0015\u0000\u0000"+
		"\u00da\u00dc\u0003 \u0010\u0000\u00db\u00d9\u0001\u0000\u0000\u0000\u00dc"+
		"\u00df\u0001\u0000\u0000\u0000\u00dd\u00db\u0001\u0000\u0000\u0000\u00dd"+
		"\u00de\u0001\u0000\u0000\u0000\u00de\u001b\u0001\u0000\u0000\u0000\u00df"+
		"\u00dd\u0001\u0000\u0000\u0000\u00e0\u00e1\u0003\u001a\r\u0000\u00e1\u00e2"+
		"\u0005\u0016\u0000\u0000\u00e2\u00e3\u0003\u001a\r\u0000\u00e3\u001d\u0001"+
		"\u0000\u0000\u0000\u00e4\u00e6\u0005\t\u0000\u0000\u00e5\u00e4\u0001\u0000"+
		"\u0000\u0000\u00e5\u00e6\u0001\u0000\u0000\u0000\u00e6\u00e7\u0001\u0000"+
		"\u0000\u0000\u00e7\u00e8\u0003$\u0012\u0000\u00e8\u00e9\u0005\n\u0000"+
		"\u0000\u00e9\u00eb\u0003 \u0010\u0000\u00ea\u00ec\u0005\b\u0000\u0000"+
		"\u00eb\u00ea\u0001\u0000\u0000\u0000\u00eb\u00ec\u0001\u0000\u0000\u0000"+
		"\u00ec\u001f\u0001\u0000\u0000\u0000\u00ed\u00f2\u0003\"\u0011\u0000\u00ee"+
		"\u00ef\u0005\u0015\u0000\u0000\u00ef\u00f1\u0003\"\u0011\u0000\u00f0\u00ee"+
		"\u0001\u0000\u0000\u0000\u00f1\u00f4\u0001\u0000\u0000\u0000\u00f2\u00f0"+
		"\u0001\u0000\u0000\u0000\u00f2\u00f3\u0001\u0000\u0000\u0000\u00f3\u0104"+
		"\u0001\u0000\u0000\u0000\u00f4\u00f2\u0001\u0000\u0000\u0000\u00f5\u00f6"+
		"\u0005\u001c\u0000\u0000\u00f6\u00f7\u0003 \u0010\u0000\u00f7\u00f8\u0005"+
		"\u001d\u0000\u0000\u00f8\u0104\u0001\u0000\u0000\u0000\u00f9\u00fa\u0005"+
		"\u001c\u0000\u0000\u00fa\u00fd\u0003 \u0010\u0000\u00fb\u00fc\u0005\u0015"+
		"\u0000\u0000\u00fc\u00fe\u0003 \u0010\u0000\u00fd\u00fb\u0001\u0000\u0000"+
		"\u0000\u00fe\u00ff\u0001\u0000\u0000\u0000\u00ff\u00fd\u0001\u0000\u0000"+
		"\u0000\u00ff\u0100\u0001\u0000\u0000\u0000\u0100\u0101\u0001\u0000\u0000"+
		"\u0000\u0101\u0102\u0005\u001d\u0000\u0000\u0102\u0104\u0001\u0000\u0000"+
		"\u0000\u0103\u00ed\u0001\u0000\u0000\u0000\u0103\u00f5\u0001\u0000\u0000"+
		"\u0000\u0103\u00f9\u0001\u0000\u0000\u0000\u0104!\u0001\u0000\u0000\u0000"+
		"\u0105\u0114\u00030\u0018\u0000\u0106\u0114\u00032\u0019\u0000\u0107\u0114"+
		"\u00036\u001b\u0000\u0108\u0114\u0003&\u0013\u0000\u0109\u0114\u0003("+
		"\u0014\u0000\u010a\u0114\u0003*\u0015\u0000\u010b\u0114\u0003,\u0016\u0000"+
		"\u010c\u0114\u0003.\u0017\u0000\u010d\u0114\u0003$\u0012\u0000\u010e\u0114"+
		"\u0005!\u0000\u0000\u010f\u0114\u0005\u0018\u0000\u0000\u0110\u0114\u0005"+
		"\u001e\u0000\u0000\u0111\u0114\u0005\"\u0000\u0000\u0112\u0114\u0005\u001b"+
		"\u0000\u0000\u0113\u0105\u0001\u0000\u0000\u0000\u0113\u0106\u0001\u0000"+
		"\u0000\u0000\u0113\u0107\u0001\u0000\u0000\u0000\u0113\u0108\u0001\u0000"+
		"\u0000\u0000\u0113\u0109\u0001\u0000\u0000\u0000\u0113\u010a\u0001\u0000"+
		"\u0000\u0000\u0113\u010b\u0001\u0000\u0000\u0000\u0113\u010c\u0001\u0000"+
		"\u0000\u0000\u0113\u010d\u0001\u0000\u0000\u0000\u0113\u010e\u0001\u0000"+
		"\u0000\u0000\u0113\u010f\u0001\u0000\u0000\u0000\u0113\u0110\u0001\u0000"+
		"\u0000\u0000\u0113\u0111\u0001\u0000\u0000\u0000\u0113\u0112\u0001\u0000"+
		"\u0000\u0000\u0114#\u0001\u0000\u0000\u0000\u0115\u0116\u0005%\u0000\u0000"+
		"\u0116%\u0001\u0000\u0000\u0000\u0117\u0118\u0005\u000b\u0000\u0000\u0118"+
		"\u0119\u0005\u0014\u0000\u0000\u0119\'\u0001\u0000\u0000\u0000\u011a\u011b"+
		"\u0005\f\u0000\u0000\u011b\u011c\u0005\u0014\u0000\u0000\u011c)\u0001"+
		"\u0000\u0000\u0000\u011d\u011e\u0005\r\u0000\u0000\u011e+\u0001\u0000"+
		"\u0000\u0000\u011f\u0120\u0005\r\u0000\u0000\u0120\u0121\u0005\u000e\u0000"+
		"\u0000\u0121\u0122\u0003B!\u0000\u0122-\u0001\u0000\u0000\u0000\u0123"+
		"\u0126\u0005\u000f\u0000\u0000\u0124\u0125\u0005\u000e\u0000\u0000\u0125"+
		"\u0127\u0003B!\u0000\u0126\u0124\u0001\u0000\u0000\u0000\u0126\u0127\u0001"+
		"\u0000\u0000\u0000\u0127/\u0001\u0000\u0000\u0000\u0128\u0129\u0005%\u0000"+
		"\u0000\u0129\u012a\u0005\u000e\u0000\u0000\u012a\u012b\u0003J%\u0000\u012b"+
		"\u012d\u0005\u001c\u0000\u0000\u012c\u012e\u0003B!\u0000\u012d\u012c\u0001"+
		"\u0000\u0000\u0000\u012d\u012e\u0001\u0000\u0000\u0000\u012e\u0131\u0001"+
		"\u0000\u0000\u0000\u012f\u0130\u0005\u001a\u0000\u0000\u0130\u0132\u0003"+
		">\u001f\u0000\u0131\u012f\u0001\u0000\u0000\u0000\u0131\u0132\u0001\u0000"+
		"\u0000\u0000\u0132\u0135\u0001\u0000\u0000\u0000\u0133\u0134\u0005\u001a"+
		"\u0000\u0000\u0134\u0136\u0005\u0017\u0000\u0000\u0135\u0133\u0001\u0000"+
		"\u0000\u0000\u0135\u0136\u0001\u0000\u0000\u0000\u0136\u0137\u0001\u0000"+
		"\u0000\u0000\u0137\u0138\u0005\u001d\u0000\u0000\u01381\u0001\u0000\u0000"+
		"\u0000\u0139\u013a\u0005%\u0000\u0000\u013a\u013c\u0005\u001c\u0000\u0000"+
		"\u013b\u013d\u00034\u001a\u0000\u013c\u013b\u0001\u0000\u0000\u0000\u013c"+
		"\u013d\u0001\u0000\u0000\u0000\u013d\u013e\u0001\u0000\u0000\u0000\u013e"+
		"\u013f\u0005\u001d\u0000\u0000\u013f3\u0001\u0000\u0000\u0000\u0140\u0147"+
		"\u0003 \u0010\u0000\u0141\u0143\u0005\u001a\u0000\u0000\u0142\u0141\u0001"+
		"\u0000\u0000\u0000\u0142\u0143\u0001\u0000\u0000\u0000\u0143\u0144\u0001"+
		"\u0000\u0000\u0000\u0144\u0146\u0003 \u0010\u0000\u0145\u0142\u0001\u0000"+
		"\u0000\u0000\u0146\u0149\u0001\u0000\u0000\u0000\u0147\u0145\u0001\u0000"+
		"\u0000\u0000\u0147\u0148\u0001\u0000\u0000\u0000\u01485\u0001\u0000\u0000"+
		"\u0000\u0149\u0147\u0001\u0000\u0000\u0000\u014a\u014b\u0006\u001b\uffff"+
		"\uffff\u0000\u014b\u016c\u0003F#\u0000\u014c\u016c\u0005\u0014\u0000\u0000"+
		"\u014d\u014e\u0005\u0014\u0000\u0000\u014e\u014f\u0005\u0010\u0000\u0000"+
		"\u014f\u0154\u0005\u0011\u0000\u0000\u0150\u0151\u0005\u0003\u0000\u0000"+
		"\u0151\u0152\u0003>\u001f\u0000\u0152\u0153\u0005\u0004\u0000\u0000\u0153"+
		"\u0155\u0001\u0000\u0000\u0000\u0154\u0150\u0001\u0000\u0000\u0000\u0154"+
		"\u0155\u0001\u0000\u0000\u0000\u0155\u016c\u0001\u0000\u0000\u0000\u0156"+
		"\u0157\u0005\u0014\u0000\u0000\u0157\u0158\u0005\u0019\u0000\u0000\u0158"+
		"\u016c\u0005\u0014\u0000\u0000\u0159\u015a\u0005\u0014\u0000\u0000\u015a"+
		"\u015b\u0005\u0003\u0000\u0000\u015b\u015c\u0003>\u001f\u0000\u015c\u015d"+
		"\u0005\u0004\u0000\u0000\u015d\u016c\u0001\u0000\u0000\u0000\u015e\u015f"+
		"\u0005\u0014\u0000\u0000\u015f\u0160\u0005\u0010\u0000\u0000\u0160\u0161"+
		"\u00038\u001c\u0000\u0161\u0162\u0005\u0011\u0000\u0000\u0162\u016c\u0001"+
		"\u0000\u0000\u0000\u0163\u0164\u0005\u0014\u0000\u0000\u0164\u0165\u0005"+
		"\u0010\u0000\u0000\u0165\u0166\u00038\u001c\u0000\u0166\u0167\u0005\u0011"+
		"\u0000\u0000\u0167\u0168\u0005\u0003\u0000\u0000\u0168\u0169\u0003>\u001f"+
		"\u0000\u0169\u016a\u0005\u0004\u0000\u0000\u016a\u016c\u0001\u0000\u0000"+
		"\u0000\u016b\u014a\u0001\u0000\u0000\u0000\u016b\u014c\u0001\u0000\u0000"+
		"\u0000\u016b\u014d\u0001\u0000\u0000\u0000\u016b\u0156\u0001\u0000\u0000"+
		"\u0000\u016b\u0159\u0001\u0000\u0000\u0000\u016b\u015e\u0001\u0000\u0000"+
		"\u0000\u016b\u0163\u0001\u0000\u0000\u0000\u016c\u0172\u0001\u0000\u0000"+
		"\u0000\u016d\u016e\n\u0001\u0000\u0000\u016e\u016f\u0005\u0012\u0000\u0000"+
		"\u016f\u0171\u00036\u001b\u0002\u0170\u016d\u0001\u0000\u0000\u0000\u0171"+
		"\u0174\u0001\u0000\u0000\u0000\u0172\u0170\u0001\u0000\u0000\u0000\u0172"+
		"\u0173\u0001\u0000\u0000\u0000\u01737\u0001\u0000\u0000\u0000\u0174\u0172"+
		"\u0001\u0000\u0000\u0000\u0175\u0178\u0003:\u001d\u0000\u0176\u0177\u0005"+
		"\b\u0000\u0000\u0177\u0179\u0003:\u001d\u0000\u0178\u0176\u0001\u0000"+
		"\u0000\u0000\u0178\u0179\u0001\u0000\u0000\u0000\u01799\u0001\u0000\u0000"+
		"\u0000\u017a\u017f\u0003<\u001e\u0000\u017b\u017c\u0005\u001a\u0000\u0000"+
		"\u017c\u017e\u0003<\u001e\u0000\u017d\u017b\u0001\u0000\u0000\u0000\u017e"+
		"\u0181\u0001\u0000\u0000\u0000\u017f\u017d\u0001\u0000\u0000\u0000\u017f"+
		"\u0180\u0001\u0000\u0000\u0000\u0180;\u0001\u0000\u0000\u0000\u0181\u017f"+
		"\u0001\u0000\u0000\u0000\u0182\u018a\u0005\u0014\u0000\u0000\u0183\u0184"+
		"\u0005\u0014\u0000\u0000\u0184\u0186\u0005\u0019\u0000\u0000\u0185\u0187"+
		"\u0005#\u0000\u0000\u0186\u0185\u0001\u0000\u0000\u0000\u0186\u0187\u0001"+
		"\u0000\u0000\u0000\u0187\u0188\u0001\u0000\u0000\u0000\u0188\u018a\u0005"+
		"!\u0000\u0000\u0189\u0182\u0001\u0000\u0000\u0000\u0189\u0183\u0001\u0000"+
		"\u0000\u0000\u018a=\u0001\u0000\u0000\u0000\u018b\u0191\u0003@ \u0000"+
		"\u018c\u018d\u0003H$\u0000\u018d\u018e\u0003@ \u0000\u018e\u0190\u0001"+
		"\u0000\u0000\u0000\u018f\u018c\u0001\u0000\u0000\u0000\u0190\u0193\u0001"+
		"\u0000\u0000\u0000\u0191\u018f\u0001\u0000\u0000\u0000\u0191\u0192\u0001"+
		"\u0000\u0000\u0000\u0192?\u0001\u0000\u0000\u0000\u0193\u0191\u0001\u0000"+
		"\u0000\u0000\u0194\u0195\u0005\u0014\u0000\u0000\u0195\u0196\u0005\u0016"+
		"\u0000\u0000\u0196\u01a4\u0003\u001a\r\u0000\u0197\u0198\u0003B!\u0000"+
		"\u0198\u0199\u0005\u0016\u0000\u0000\u0199\u019a\u0003\u001a\r\u0000\u019a"+
		"\u01a4\u0001\u0000\u0000\u0000\u019b\u019c\u0003D\"\u0000\u019c\u019d"+
		"\u0005\u0016\u0000\u0000\u019d\u019e\u0003\u001a\r\u0000\u019e\u01a4\u0001"+
		"\u0000\u0000\u0000\u019f\u01a0\u0003\u001a\r\u0000\u01a0\u01a1\u0005\u0016"+
		"\u0000\u0000\u01a1\u01a2\u0003\u001a\r\u0000\u01a2\u01a4\u0001\u0000\u0000"+
		"\u0000\u01a3\u0194\u0001\u0000\u0000\u0000\u01a3\u0197\u0001\u0000\u0000"+
		"\u0000\u01a3\u019b\u0001\u0000\u0000\u0000\u01a3\u019f\u0001\u0000\u0000"+
		"\u0000\u01a4A\u0001\u0000\u0000\u0000\u01a5\u01a6\u0006!\uffff\uffff\u0000"+
		"\u01a6\u01a7\u0005%\u0000\u0000\u01a7\u01ad\u0001\u0000\u0000\u0000\u01a8"+
		"\u01a9\n\u0001\u0000\u0000\u01a9\u01aa\u0005\u000e\u0000\u0000\u01aa\u01ac"+
		"\u0003B!\u0002\u01ab\u01a8\u0001\u0000\u0000\u0000\u01ac\u01af\u0001\u0000"+
		"\u0000\u0000\u01ad\u01ab\u0001\u0000\u0000\u0000\u01ad\u01ae\u0001\u0000"+
		"\u0000\u0000\u01aeC\u0001\u0000\u0000\u0000\u01af\u01ad\u0001\u0000\u0000"+
		"\u0000\u01b0\u01b1\u0005\u0013\u0000\u0000\u01b1E\u0001\u0000\u0000\u0000"+
		"\u01b2\u01b3\u0007\u0000\u0000\u0000\u01b3G\u0001\u0000\u0000\u0000\u01b4"+
		"\u01b5\u0007\u0001\u0000\u0000\u01b5I\u0001\u0000\u0000\u0000\u01b6\u01b7"+
		"\u0005%\u0000\u0000\u01b7K\u0001\u0000\u0000\u0000)OXahq\u0080\u008b\u008f"+
		"\u0097\u009b\u00a5\u00b6\u00c6\u00ca\u00cf\u00d2\u00d6\u00dd\u00e5\u00eb"+
		"\u00f2\u00ff\u0103\u0113\u0126\u012d\u0131\u0135\u013c\u0142\u0147\u0154"+
		"\u016b\u0172\u0178\u017f\u0186\u0189\u0191\u01a3\u01ad";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}