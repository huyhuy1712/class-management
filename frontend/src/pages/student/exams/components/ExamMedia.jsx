import MediaImagePreview from '../../../teacher/exams/builder/components/common/MediaImagePreview'

export default function ExamMedia({ imageMedia, audioMedia }) {
  return <>{imageMedia?.url && <div className="my-3 max-w-xl"><MediaImagePreview file={imageMedia} /></div>}{audioMedia?.url && <audio controls preload="metadata" src={audioMedia.url} className="my-3 max-w-full" />}</>
}
