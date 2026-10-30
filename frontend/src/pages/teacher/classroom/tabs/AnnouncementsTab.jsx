import ClassAnnouncementsFeed from '../../../../components/classroom/announcements/ClassAnnouncementsFeed'
import { useParams } from 'react-router-dom'

function AnnouncementsTab() {
  const { classId } = useParams()
  return <ClassAnnouncementsFeed key={classId} />
}

export default AnnouncementsTab