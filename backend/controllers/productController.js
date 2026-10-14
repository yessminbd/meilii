import productModel from "../models/productModel.js"
import { v2 as cloudinary } from "cloudinary"

// ajouter produit
const addProduct = async (req, res) => {
    try {

        // Récupèrer les champs envoyés 
        const { name, description, price, originalPrice, pattern, category, subCategory, sizes, sizeType, colors, popular } = req.body

        let parsedCategory = []
        try {
            parsedCategory = typeof category === 'string' ? JSON.parse(category) : (Array.isArray(category) ? category : [])
        } catch (e) {
            parsedCategory = category ? [category] : []
        }

        // Récupérer les images 
        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        // Eviter les images (ubdefined) => ne sont pas envoyées
        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

        // Uploader chaque image vers Cloudinary
        const imagesUrl = await Promise.all(
            images.map(async (item) => {
                //item.path => chemin local de l'image
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' })
                // Récupèrer les URLs finales hébergées sur Cloudinary
                return result.secure_url
            }))

        let parsedSizes = []
        try {
            parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : (Array.isArray(sizes) ? sizes : [])
        } catch (e) {
            parsedSizes = sizes ? [sizes] : []
        }

        let parsedColors = []
        try {
            parsedColors = typeof colors === 'string' ? JSON.parse(colors) : (Array.isArray(colors) ? colors : [])
        } catch (e) {
            parsedColors = colors ? [colors] : []
        }

        const productData = {
            name,
            description,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : 0,
            pattern: pattern || '',
            category: parsedCategory,
            subCategory,
            popular: popular === 'true' || popular === true,
            sizes: parsedSizes,
            sizeType: sizeType || '',
            colors: parsedColors,
            image: imagesUrl,
            date: Date.now()
        }

        console.log(productData)
        const product = new productModel(productData)
        await product.save()
        res.json({ success: true, message: "Product added successfully" })
    }
    catch (error) {
        res.json({ success: false, message: error.message })

    }

}

// List all products 
const listProduct = async (req, res) => {

    try {
        const products = await productModel.find({})
        console.log(products)
        res.json({ success: true, products })
    }
    catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Remove a product or multiple products 
const removeProduct = async (req, res) => {
    try {
        const { id, ids } = req.body
        if (ids && Array.isArray(ids) && ids.length > 0) {
            await productModel.deleteMany({ _id: { $in: ids } })
            return res.json({ success: true, message: `${ids.length} product(s) removed successfully` })
        }
        if (id) {
            await productModel.findByIdAndDelete(id)
            return res.json({ success: true, message: "Product removed successfully" })
        }
        return res.json({ success: false, message: "Product ID or IDs are required" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Find a single product
const singleProduct = async (req, res) => {
    try {
        const productId = req.query?.productId || req.body?.productId || req.params?.productId
        if (!productId) {
            return res.json({ success: false, message: "Product ID is required" })
        }
        const product = await productModel.findById(productId)
        if (!product) {
            return res.json({ success: false, message: "Product not found" })
        }
        res.json({ success: true, product })
    }
    catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Update a product
const updateProduct = async (req, res) => {
    try {
        const { id, name, description, price, originalPrice, pattern, category, subCategory, sizes, sizeType, colors, popular, existingImages } = req.body

        // Parse category
        let parsedCategory = undefined
        if (category !== undefined) {
            try {
                parsedCategory = typeof category === 'string' ? JSON.parse(category) : (Array.isArray(category) ? category : [category])
            } catch (e) {
                parsedCategory = category ? [category] : []
            }
        }

        if (!id) {
            return res.json({ success: false, message: "Product ID is required" })
        }

        const product = await productModel.findById(id)
        if (!product) {
            return res.json({ success: false, message: "Product not found" })
        }

        // Upload any newly provided images
        let uploadedUrls = []
        if (req.files) {
            const image1 = req.files.image1 && req.files.image1[0]
            const image2 = req.files.image2 && req.files.image2[0]
            const image3 = req.files.image3 && req.files.image3[0]
            const image4 = req.files.image4 && req.files.image4[0]
            const newFiles = [image1, image2, image3, image4].filter(Boolean)

            if (newFiles.length > 0) {
                uploadedUrls = await Promise.all(
                    newFiles.map(async (item) => {
                        const result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' })
                        return result.secure_url
                    })
                )
            }
        }

        // Parse sizes
        let parsedSizes = product.sizes
        if (sizes !== undefined) {
            try {
                parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : (Array.isArray(sizes) ? sizes : [sizes])
            } catch (e) {
                parsedSizes = sizes ? [sizes] : []
            }
        }

        // Parse colors
        let parsedColors = product.colors
        if (colors !== undefined) {
            try {
                parsedColors = typeof colors === 'string' ? JSON.parse(colors) : (Array.isArray(colors) ? colors : [colors])
            } catch (e) {
                parsedColors = colors ? [colors] : []
            }
        }

        // Handle images: combination of existingImages + newly uploaded images
        let finalImages = product.image
        if (existingImages !== undefined) {
            let parsedExisting = []
            try {
                parsedExisting = typeof existingImages === 'string' ? JSON.parse(existingImages) : (Array.isArray(existingImages) ? existingImages : [existingImages])
            } catch (e) {
                parsedExisting = existingImages ? [existingImages] : []
            }
            finalImages = [...parsedExisting, ...uploadedUrls]
        } else if (uploadedUrls.length > 0) {
            finalImages = [...(product.image || []), ...uploadedUrls]
        }

        // Build update object
        const updateFields = {}
        if (name !== undefined) updateFields.name = name
        if (description !== undefined) updateFields.description = description
        if (price !== undefined) updateFields.price = Number(price)
        if (originalPrice !== undefined) updateFields.originalPrice = Number(originalPrice)
        if (pattern !== undefined) updateFields.pattern = pattern
        if (parsedCategory !== undefined) updateFields.category = parsedCategory
        if (subCategory !== undefined) updateFields.subCategory = subCategory
        if (popular !== undefined) updateFields.popular = popular === 'true' || popular === true
        if (sizes !== undefined) updateFields.sizes = parsedSizes
        if (sizeType !== undefined) updateFields.sizeType = sizeType
        if (colors !== undefined) updateFields.colors = parsedColors
        if (finalImages && finalImages.length > 0) updateFields.image = finalImages

        const updatedProduct = await productModel.findByIdAndUpdate(id, updateFields, { new: true })
        res.json({ success: true, message: "Product updated successfully", product: updatedProduct })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get dynamic config (brands, sizes, colors) from existing products
const getConfig = async (req, res) => {
    try {
        const products = await productModel.find({}, { subCategory: 1, sizes: 1, colors: 1 })

        const brandsSet = new Set()
        const sizesSet = new Set()
        const colorsSet = new Set()

        products.forEach((p) => {
            if (p.subCategory) brandsSet.add(p.subCategory.trim())
            if (Array.isArray(p.sizes)) p.sizes.forEach((s) => sizesSet.add(String(s).trim()))
            if (Array.isArray(p.colors)) p.colors.forEach((c) => {
                if (typeof c === 'string') colorsSet.add(c.trim())
            })
        })

        res.json({
            success: true,
            brands: [...brandsSet].sort(),
            sizes: [...sizesSet].sort((a, b) => parseFloat(a) - parseFloat(b)),
            colors: [...colorsSet].sort(),
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export { addProduct, listProduct, removeProduct, singleProduct, updateProduct, getConfig }