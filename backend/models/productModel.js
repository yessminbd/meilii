import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    pattern: { type: String, default: '' },
    image: { type: Array, required: true },
    category: { type: Array, required: true },
    subCategory: { type: String, required: true },
    sizes: { type: Array },
    sizeType: { type: String, default: '' }, // id of the SizeType group used
    colors: { type: Array },
    popular: { type: Boolean },
    date: { type: Number, required: true },
})
const productModel = mongoose.models.product || mongoose.model('product', productSchema)
export default productModel