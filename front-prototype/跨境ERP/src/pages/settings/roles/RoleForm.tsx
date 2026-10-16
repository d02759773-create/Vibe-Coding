import { PageContainer, ProForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { Button, Card, Space, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import type { RoleCode } from '@/features/settings/constants'
import { getRole, listRoles, nowString, saveRoles } from '@/features/settings/storage'

export function RoleForm() {
  const { roleCode } = useParams()
  const navigate = useNavigate()
  const role = roleCode ? getRole(roleCode as RoleCode) : undefined

  if (!role) {
    return (
      <PageContainer title="角色不存在">
        <Button onClick={() => navigate('/settings/roles')}>返回列表</Button>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="编辑角色"
      subTitle={role.角色编码}
      onBack={() => navigate(`/settings/roles/${role.角色编码}`)}
    >
      <Card>
        <ProForm
          initialValues={{
            角色编码: role.角色编码,
            角色名称: role.角色名称,
            角色说明: role.角色说明,
          }}
          submitter={{
            render: () => (
              <Space>
                <Button onClick={() => navigate(`/settings/roles/${role.角色编码}`)}>返回</Button>
                <Button type="primary" htmlType="submit">保存</Button>
              </Space>
            ),
          }}
          onFinish={async (values) => {
            const roles = listRoles().map((r) =>
              r.角色编码 === role.角色编码
                ? {
                    ...r,
                    角色名称: String(values.角色名称 ?? '').trim(),
                    角色说明: String(values.角色说明 ?? '').trim(),
                    最后修改人: 'admin',
                    最后修改时间: nowString(),
                  }
                : r,
            )
            saveRoles(roles)
            message.success('保存成功')
            navigate(`/settings/roles/${role.角色编码}`)
            return true
          }}
        >
          <ProFormText name="角色编码" label="角色编码" readonly />
          <ProFormText
            name="角色名称"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
            fieldProps={{ maxLength: 50 }}
          />
          <ProFormTextArea name="角色说明" label="角色说明" fieldProps={{ maxLength: 200, rows: 3 }} />
        </ProForm>
      </Card>
    </PageContainer>
  )
}
