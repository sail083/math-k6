import { useState } from 'react';

type Mode = 'addition' | 'subtraction';

interface ColumnArithmeticLabProps {
  onInteract?: () => void;
}

const lessons = {
  addition: {
    expression: '356 + 278',
    rows: [
      { place: '个位', action: '6 + 8 = 14', write: '写 4，向十位进 1', digits: ['4', '', ''] },
      { place: '十位', action: '5 + 7 + 1 = 13', write: '写 3，向百位进 1', digits: ['4', '3', ''] },
      { place: '百位', action: '3 + 2 + 1 = 6', write: '写 6，结果是 634', digits: ['4', '3', '6'] },
    ],
    top: ['3', '5', '6'],
    bottom: ['2', '7', '8'],
    result: ['6', '3', '4'],
    carry: ['1', '1', ''],
    symbol: '+',
  },
  subtraction: {
    expression: '524 - 286',
    rows: [
      { place: '个位', action: '4 不够减 6', write: '借 1 个十换成 10 个一：14 - 6 = 8', digits: ['8', '', ''] },
      { place: '十位', action: '剩 1 个十，不够减 8', write: '借 1 个百换成 10 个十：11 - 8 = 3', digits: ['8', '3', ''] },
      { place: '百位', action: '5 个百借走 1 个，剩 4 个百', write: '4 - 2 = 2，结果是 238', digits: ['8', '3', '2'] },
    ],
    top: ['5', '2', '4'],
    bottom: ['2', '8', '6'],
    result: ['2', '3', '8'],
    carry: ['借 1 百', '借 1 十', ''],
    symbol: '-',
  },
} as const;

export default function ColumnArithmeticLab({ onInteract }: ColumnArithmeticLabProps) {
  const [mode, setMode] = useState<Mode>('addition');
  const [step, setStep] = useState(0);
  const lesson = lessons[mode];
  const active = lesson.rows[step];

  const selectMode = (next: Mode) => {
    setMode(next);
    setStep(0);
    onInteract?.();
  };

  const advance = () => {
    setStep((value) => Math.min(2, value + 1));
    onInteract?.();
  };

  return (
    <div className="column-lab">
      <div className="column-lab__toolbar" aria-label="选择计算类型">
        <button type="button" className={mode === 'addition' ? 'is-active' : ''} onClick={() => selectMode('addition')}>进位加法</button>
        <button type="button" className={mode === 'subtraction' ? 'is-active' : ''} onClick={() => selectMode('subtraction')}>退位减法</button>
      </div>

      <div className="column-lab__workspace">
        <div className="place-table" aria-label={`${lesson.expression} 竖式`}>
          <div className="place-table__heads"><span>百位</span><span>十位</span><span>个位</span></div>
          <div className="place-table__carry">{lesson.carry.map((value, index) => {
            const target = 1 - step;
            const revealed = index >= Math.max(0, target) && index <= 1;
            return <span key={index} className={index === target ? 'is-focus' : revealed ? 'is-past' : ''}>{value}</span>;
          })}</div>
          <div className="place-table__row">{lesson.top.map((value, index) => <strong key={index}>{value}</strong>)}</div>
          <div className="place-table__row has-symbol"><i>{lesson.symbol}</i>{lesson.bottom.map((value, index) => <strong key={index}>{value}</strong>)}</div>
          <div className="place-table__line" />
          <div className="place-table__row result">{lesson.result.map((value, index) => <strong key={index} className={index >= 2 - step ? 'is-visible' : ''}>{value}</strong>)}</div>
        </div>

        <div className="column-lab__explain" aria-live="polite">
          <span>第 {step + 1} 步 · {active.place}</span>
          <h3>{active.action}</h3>
          <p>{active.write}</p>
          <div className="base-ten-exchange">
            <i>{mode === 'addition' ? '10 个本位单位' : '1 个高位单位'}</i>
            <b>⇄</b>
            <i>{mode === 'addition' ? '1 个高位单位' : '10 个本位单位'}</i>
          </div>
        </div>
      </div>

      <div className="column-lab__footer">
        <div>{lesson.rows.map((_, index) => <button key={index} type="button" aria-label={`查看第 ${index + 1} 步`} onClick={() => { setStep(index); onInteract?.(); }} className={index === step ? 'is-active' : ''}>{index + 1}</button>)}</div>
        <button type="button" onClick={advance} disabled={step === 2}>{step === 2 ? `${lesson.expression} = ${lesson.result.join('')}` : '计算下一位 →'}</button>
      </div>
    </div>
  );
}
