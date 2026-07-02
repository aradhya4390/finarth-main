import Entry from '../models/Entry.js'

// Create
export async function createEntry(req, res) {
  try {
    const { title, content, numericValue, tags } = req.body
    const entry = await Entry.create({
      user: req.userId,
      title: title || '',
      content: content || '',
      numericValue: numericValue || 0,
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' && tags.length ? tags.split(',').map(t=>t.trim()) : [])
    })
    return res.json(entry)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not create entry' })
  }
}

// List
export async function listEntries(req, res) {
  try {
    const entries = await Entry.find({ user: req.userId }).sort({ createdAt: -1 })
    return res.json(entries)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not fetch entries' })
  }
}

// Get one
export async function getEntry(req, res) {
  try {
    const entry = await Entry.findOne({ _id: req.params.id, user: req.userId })
    if (!entry) return res.status(404).json({ message: 'Entry not found' })
    return res.json(entry)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not fetch entry' })
  }
}

// Update
export async function updateEntry(req, res) {
  try {
    const { title, content, numericValue, tags } = req.body
    const entry = await Entry.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      {
        $set: {
          title: title || '',
          content: content || '',
          numericValue: numericValue || 0,
          tags: Array.isArray(tags) ? tags : (typeof tags === 'string' && tags.length ? tags.split(',').map(t=>t.trim()) : [])
        }
      },
      { new: true }
    )
    if (!entry) return res.status(404).json({ message: 'Entry not found or unauthorized' })
    return res.json(entry)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not update entry' })
  }
}

// Delete
export async function deleteEntry(req, res) {
  try {
    const entry = await Entry.findOneAndDelete({ _id: req.params.id, user: req.userId })
    if (!entry) return res.status(404).json({ message: 'Entry not found or unauthorized' })
    return res.json({ message: 'Deleted', id: entry._id })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not delete entry' })
  }
}
