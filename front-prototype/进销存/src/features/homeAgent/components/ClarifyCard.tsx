import { Alert, Button, Card, Checkbox, Input, Radio, Space, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { ClarifyPayload, ClarifyQuestion } from '../types'
import { previewProductMatchFromAnswers } from '../agent/enrichClarifyAnswers'
import { stripRecommendedLabel } from '../agent/runAgentTurn'

type Props = {
  payload: ClarifyPayload
  onSubmit: (answers: Record<string, unknown>) => void
  onTimeout: () => void
  timeoutMs: number
}

function normalizeQuestions(payload: ClarifyPayload): ClarifyQuestion[] {
  if (payload.questions?.length) return payload.questions
  if (payload.question) {
    return [{ id: 'q0', question: payload.question, choices: payload.choices }]
  }
  return []
}

function placeholderForQuestion(q: ClarifyQuestion): string {
  if (/数量|单位|单价|多少/.test(q.question)) {
    return '例：10 PCS，未税单价 15 元（只填数量和价格，商品名请在上一题说明）'
  }
  if (/商品|名称|编码|SKU|怎么处理|重新|说明/.test(q.question)) {
    return '例：Type-C 快充数据线 或 SKU-0001'
  }
  return '请输入'
}

export function ClarifyCard({ payload, onSubmit, onTimeout, timeoutMs }: Props) {
  const questions = useMemo(() => normalizeQuestions(payload), [payload])
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [otherText, setOtherText] = useState<Record<string, string>>({})

  const showStaleProductHint = questions.some(
    (q) => /维他命|未查到|没有匹配|未找到/.test(q.question),
  )

  useEffect(() => {
    const timer = window.setTimeout(() => onTimeout(), timeoutMs)
    return () => window.clearTimeout(timer)
  }, [onTimeout, timeoutMs])

  const recommendedIndex = payload.recommendedChoiceIndex ?? 0

  const submit = () => {
    const resolved: Record<string, unknown> = {}
    for (const q of questions) {
      const raw = answers[q.id]
      if (raw === '__other__') {
        resolved[q.id] = otherText[q.id] ?? ''
      } else {
        resolved[q.id] = raw
      }
    }
    onSubmit(resolved)
  }

  const resolvedPreview = useMemo(() => {
    const resolved: Record<string, unknown> = {}
    for (const q of questions) {
      const raw = answers[q.id]
      if (raw === '__other__') resolved[q.id] = otherText[q.id] ?? ''
      else if (raw !== undefined) resolved[q.id] = raw
    }
    return previewProductMatchFromAnswers(resolved)
  }, [answers, otherText, questions])

  const allAnswered = questions.every((q) => {
    const v = answers[q.id]
    if (q.choices?.length) {
      if (v === undefined || v === '') return false
      if (v === '__other__' && !(otherText[q.id]?.trim())) return false
      if (q.allowMultiple && Array.isArray(v) && v.length === 0) return false
      return true
    }
    return typeof v === 'string' && v.trim().length > 0
  })

  return (
    <Card size="small" title="需要您补充信息" style={{ marginTop: 8, borderColor: '#91caff' }}>
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Agent 认为当前指令不够清晰，请回答以下问题后继续。
      </Typography.Paragraph>
      {showStaleProductHint && !resolvedPreview && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="表单标题里若仍出现「维他命」"
          description="那是 AI 上一轮的旧描述。请在「商品编码或准确名称」输入框填写 Type-C 快充数据线 或 SKU-0001，并带上数量（如 10件），提交后系统会自动匹配商品档案。"
        />
      )}
      {resolvedPreview && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 12 }}
          message={`已识别商品：${resolvedPreview.productName}`}
          description={`编码 ${resolvedPreview.productCode}（id=${resolvedPreview.id}）。提交后将按此商品继续，不再追问「维他命」。`}
        />
      )}
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {questions.map((q, index) => (
          <div key={q.id}>
            <Typography.Text strong>
              {index + 1}. {q.question}
            </Typography.Text>
            {q.choices?.length ? (
              q.allowMultiple ? (
                <Checkbox.Group
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}
                  value={(answers[q.id] as string[]) ?? []}
                  onChange={(vals) => setAnswers((a) => ({ ...a, [q.id]: vals }))}
                  options={q.choices.map((c, idx) => ({
                    label:
                      idx === recommendedIndex ? `${stripRecommendedLabel(c)} (Recommended)` : c,
                    value: stripRecommendedLabel(c),
                  }))}
                />
              ) : (
                <Radio.Group
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}
                  value={answers[q.id] as string | undefined}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                >
                  {q.choices.map((c, idx) => (
                    <Radio key={c} value={stripRecommendedLabel(c)}>
                      {idx === recommendedIndex ? `${c} (Recommended)` : c}
                    </Radio>
                  ))}
                  <Radio value="__other__">其他（自行输入）</Radio>
                </Radio.Group>
              )
            ) : (
              <Input.TextArea
                rows={2}
                style={{ marginTop: 8 }}
                placeholder={placeholderForQuestion(q)}
                value={(answers[q.id] as string) ?? ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              />
            )}
            {answers[q.id] === '__other__' && (
              <Input.TextArea
                rows={2}
                style={{ marginTop: 8 }}
                placeholder="请说明"
                value={otherText[q.id] ?? ''}
                onChange={(e) => setOtherText((o) => ({ ...o, [q.id]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </Space>
      <Button type="primary" style={{ marginTop: 16 }} disabled={!allAnswered} onClick={submit}>
        提交并继续
      </Button>
    </Card>
  )
}
