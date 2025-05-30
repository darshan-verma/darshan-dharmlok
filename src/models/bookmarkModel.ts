// import mongoose, { Document, Schema } from 'mongoose';

// export interface IBookmark extends Document {
//   userId: string;
//   type?: string;
//   ItemObject?: Record<string, any>;
//   createdAt: Date;
// }

// const bookmarkSchema = new Schema<IBookmark>({
//   userId: {
//     required: true,
//     type: String
//   },
//   type: {
//     required: false,
//     type: String,
//   },
//   ItemObject: {
//     required: false,
//     type: Object,
//     default: ''
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
// }, { collection: 'BookMarks' });

// const Bookmark = mongoose.models.BookMarks || mongoose.model<IBookmark>('BookMarks', bookmarkSchema);

// export default Bookmark;
