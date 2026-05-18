import { useState } from 'react'
import { Badge, Button, Card } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import LabProfileTab from './ProfileTabs/LabProfileTab.jsx'
import AccountProfileTab from './ProfileTabs/AccountProfileTab.jsx'

export default function Profile() {
  const { labProfile } = useSelector((s) => s.auth)
  const [activeTab, setActiveTab] = useState('lab')

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h4 className="mb-1">Profile</h4>
            <p className="text-muted mb-0">Manage your lab and account settings.</p>
          </div>
          <Badge bg={labProfile ? 'success' : 'secondary'}>{labProfile ? 'Active' : 'Not ready'}</Badge>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <Button
            type="button"
            variant={activeTab === 'lab' ? 'primary' : 'outline-primary'}
            onClick={() => setActiveTab('lab')}
          >
            Lab profile
          </Button>
          <Button
            type="button"
            variant={activeTab === 'account' ? 'primary' : 'outline-primary'}
            onClick={() => setActiveTab('account')}
          >
            Account profile
          </Button>
        </div>

        {activeTab === 'lab' ? (
          <LabProfileTab />
        ) : (
          <AccountProfileTab />
        )}
      </Card.Body>
    </Card>
  )
}
