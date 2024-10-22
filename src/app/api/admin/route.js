import { NextResponse } from "next/server";
const AQ_SUB_KEY = process.env.AQ_SUB_KEY;


const mapRelationships = (products) => {
  const modelMap = {}; // {Model: SKU}
  const crossSells = {}; // {Model: ['related SKU']}

  // Step 1: Build map of model names to SKUs
  products.forEach((product) => {
    const modelName = product.models.mfrModel;
    if (modelName) {
      modelMap[modelName] = `${product.models.mfrModel} - ${product.productId}`;
    }
  });

  // Step 2: For each product, check AQSpecification for related models
  products.forEach((product) => {
    const modelName = product.models.mfrModel;
    const specString = product.specifications.AQSpecification;

    if (!crossSells[modelName]) {
      crossSells[modelName] = [];
    }

    if (modelName && specString) {
      // Find models mentioned in the specification string
      const relatedModels = Object.keys(modelMap).filter((model) =>
        specString.includes(model)
      );

      // Add related models to cross-sells
      relatedModels.forEach((relatedModel) => {
        crossSells[modelName].push(modelMap[relatedModel]);
      });
    }
  });

  return { crossSells };
};


const headers = [
  "ID",
  "Type",
  "SKU",
  "Name",
  "Published",
  "Is featured?",
  "Visibility in catalog",
  "Short description",
  "Description",
  "Date sale price starts",
  "Date sale price ends",
  "Tax status",
  "Tax class",
  "In stock?",
  "Stock",
  "Low stock amount",
  "Backorders allowed?",
  "Sold individually?",
  "Weight (lbs)",
  "Length (in)",
  "Width (in)",
  "Height (in)",
  "Allow customer reviews?",
  "Purchase note",
  "Sale price",
  "Regular price",
  "Categories",
  "Tags",
  "Shipping class",
  "Images",

  
  
  "Download limit",
  "Download expiry days",
  "Parent",
  "Grouped products",
  "Upsells",
  "Cross-sells",
  "External URL",
  "Button text",
  "Position",
  "Attribute 1 name",
  "Attribute 1 value(s)",
  "Attribute 1 visible",
  "Attribute 1 global",
  "Attribute 2 name",
  "Attribute 2 value(s)",
  "Attribute 2 visible",
  "Attribute 2 global",
  "Attribute 3 name",
  "Attribute 3 value(s)",
  "Attribute 3 visible",
  "Attribute 3 global",
  "Attribute 4 name",
  "Attribute 4 value(s)",
  "Attribute 4 visible",
  "Attribute 4 global",
  "Attribute 5 name",
  "Attribute 5 value(s)",
  "Attribute 5 visible",
  "Attribute 5 global",
  "Attribute 6 name",
  "Attribute 6 value(s)",
  "Attribute 6 visible",
  "Attribute 6 global",
  "Attribute 7 name",
  "Attribute 7 value(s)",
  "Attribute 7 visible",
  "Attribute 7 global",

  "Attribute 8 name",
  "Attribute 8 value(s)",
  "Attribute 8 visible",
  "Attribute 8 global",

  "Attribute 9 name",
  "Attribute 9 value(s)",
  "Attribute 9 visible",
  "Attribute 9 global",

  "Attribute 10 name",
  "Attribute 10 value(s)",
  "Attribute 10 visible",
  "Attribute 10 global",

  "Attribute 11 name",
  "Attribute 11 value(s)",
  "Attribute 11 visible",
  "Attribute 11 global",

  // "Meta: custom_fields",
  // "meta:documents",
  "meta:brand",
  "meta:certifications"
];
const escapeField = (field) => {
  if (field === undefined || field === null) {
    return "";
  }
  field = String(field).replace(/"/g, '""');
  if (field.includes(",") || field.includes("\n") || field.includes('"')) {
    field = `"${field}"`;
  }
  return field;
};

function findParentCategory(categoryId, categoriesList) {
  for (const category of categoriesList) {
    if (category.categoryId === categoryId) {
      return null; // The category is found, but it's not a parent.
    }

    if (category.subcategories && category.subcategories.length > 0) {
      const foundCategory = category.subcategories.find(
        (sub) => sub.categoryId === categoryId
      );
      if (foundCategory) {
        return category; // Return the parent category.
      } else {
        // Recursively search through the subcategories.
        const parentCategory = findParentCategory(
          categoryId,
          category.subcategories
        );
        if (parentCategory) {
          return parentCategory;
        }
      }
    }
  }
  return null; // Return null if no parent is found.
}

function createCategory(
  category,
  aqCategories,
  categoryHeirarchy = [category.name.replace(/&amp;/g, "&")]
) {
  // Find the parent category.
  const parentCategory = findParentCategory(category.categoryId, aqCategories);

  // If a parent is found, keep going up the chain.
  if (parentCategory) {
    const parentName = parentCategory.name.replace(/&amp;/g, "&");

    // Add parent category to the hierarchy
    categoryHeirarchy.unshift(parentName);

    // Recursively find grandparent categories, continuing up the hierarchy.
    return createCategory(
      {
        name: parentCategory.name.replace(/&amp;/g, "&"),
        categoryId: parentCategory.categoryId,
      },
      aqCategories,
      categoryHeirarchy
    );
  }

  // Base case: no more parent categories
  // At this point, the category hierarchy is fully built.

  if (categoryHeirarchy.length > 0) {
    const lastCategory = categoryHeirarchy[categoryHeirarchy.length - 1];
    if (lastCategory.includes(",")) {
      categoryHeirarchy.pop(); // Pop the last element if it contains a comma
    }
  }

  const newCatString = categoryHeirarchy.join(" > ");
  return newCatString;
}

const mapProductCsv = async (item, aqCategories, productRelationships) => {
  const clevelandId = "9bcbe7a0-be0d-dd11-a23a-00304834a8c9"; // Cleveland ID


  const { crossSells } = productRelationships;
  const crossSellsField = crossSells[item.models.mfrModel];

  const categories = createCategory(item.productCategory, aqCategories);
 

  const images = item.pictures
    .map((pic) => {
      return pic.url;
    })
    .join(", ");

  let i = 0;

  const attributes = item.categoryValues.map((att) => {
    i++;
    return {
      // Replace 'type' with 'kind' and remove '(Side - side)' and '(Front-back)'
      [`Attribute ${i} name`]: att.property
        .replace(/type/gi, "kind") // Replace 'type' with 'kind'
        .replace(/\(Side - side\)/gi, "") // Remove '(Side - side)'
        .replace(/\(Front - back\)/gi, ""), // Remove '(Front-back)'

      [`Attribute ${i} value(s)`]: att.value
        .replace(/\(Side - side\)/gi, "") // Remove '(Side - side)' from values
        .replace(/\(Front - back\)/gi, ""), // Remove '(Front-back)' from values

      [`Attribute ${i} visible`]: "1",
      [`Attribute ${i} global`]: "1",
    };
  });

  const documents = item.documents || [];



  const newProduct = {
    Type: "simple",
    Published: item.mfrId === clevelandId ? "0" : "1", // Set as draft for Cleveland products
    "Visibility in catalog": "visible",
    "In stock?": "1",
    SKU: `${item.models.mfrModel} - ${item.mfrId}`,
    Name: `${item.brandName} ${item.models.mfrModel}`,
    "Short description": item.specifications?.AQSpecification || "",
    Description:
      item.specifications?.AQSpecification?.split(",")
        .map((item) => `<li>${item.trim()}</li>`)
        .join("") || "",
    "Weight (lbs)": item.productDimension.shippingWeight,
    "Length (in)": item.productDimension.productDepth,
    "Width (in)": item.productDimension.productWidth,
    "Height (in)": item.productDimension.productHeight,
    "Regular price": item.pricing?.mapMrpPrice?.toFixed(2) || "0.00",
    Categories: categories,
    Tags: item.productCategory.name
      .replace(/^Refrigerator \/ Freezer/, "Refrigerator, Freezer")
      .replace(/^Chemicals:/, "")
      .trim(),

    "Shipping class": item.freightClass,
    Images: images,
    "Cross-sells": crossSellsField.join(", "),
    "meta:brand": item.brandName,
    "meta:certifications": item.certifications,
    // ...downloads
  };

  attributes.forEach((obj) => {
    for (let key in obj) {
      newProduct[key] = obj[key];
    }
  });



  for (const doc of documents) {
    const headerName = `meta:documents-${doc.name}`;
    if (!headers.includes(headerName)) {
      headers.push(headerName);
    }
    newProduct[headerName] = doc.url;
  }

// console.log(newProduct)
  return newProduct;
};

const mapProductApi = async (item, aqCategories, productRelationships) => {
  const { crossSells } = productRelationships;
  const crossSellsField = crossSells[item.models.mfrModel];

  const categories = createCategory(item.productCategory, aqCategories);

  const attributes = item.categoryValues.map((att) => ({
    // Replace 'type' with 'kind' and remove '(Side - side)' and '(Front-back)'
    name: att.property
      .replace(/type/gi, "kind") // Replace 'type' with 'kind'
      .replace(/\(Side - side\)/gi, "") // Remove '(Side - side)'
      .replace(/\(Front - back\)/gi, ""), // Remove '(Front-back)'

    value: att.value
      .replace(/\(Side - side\)/gi, "") // Remove '(Side - side)' from values
      .replace(/\(Front - back\)/gi, ""), // Remove '(Front-back)' from values

    visible: "1",
    global: "1",
  }));

  const newProduct = {
    Type: "simple",
    Published: "1",
    Visibility: "visible",
    "In stock?": "1",
    SKU: `${item.models.mfrModel} - ${item.productId}`,
    Name: `${item.brandName || ""} ${item.models.mfrModel}`,
    "Short description": item.specifications?.AQSpecification || "",
    Description:
      item.specifications?.AQSpecification?.split(",")
        .map((item) => `<li>${item.trim()}</li>`)
        .join("") || "",
    "Weight (lbs)": item.productDimension.shippingWeight,
    "Length (in)": item.productDimension.productDepth,
    "Width (in)": item.productDimension.productWidth,
    "Height (in)": item.productDimension.productHeight,
    "Regular price": item.pricing?.mapMrpPrice?.toFixed(2) || "0.00",
    Categories: categories,
    Tags: item.productCategory.name
      .replace(/^Refrigerator \/ Freezer/, "Refrigerator, Freezer")
      .replace(/^Chemicals:/, "")
      .trim()
      .split(", "),

    "Shipping class": item.freightClass,
    Images: item.pictures,
    "Cross-sells": crossSellsField,
    "meta:documents": item.documents,
    "meta:brand": item.brandName,
    "meta:certifications": item.certifications,
    Attributes: attributes,
  };
  return newProduct;
};

// Function to generate CSV content
function generateCSV(products) {
  let rows = [];

  // Add headers
  rows.push(headers.join(","));

  // Add product rows
  products.forEach((product) => {
    const productRow = headers
      .map((header) => escapeField(product[header]))
      .join(",");
    rows.push(productRow);
  });

  // Join rows with newline separator
  return rows.join("\n");
}

async function callAQforProducts(manufIds) {
  console.log("Calling AQ for products");
  // array of Ids
  try {
    const products = [];
    for (const Id of manufIds) {
      // call API
      const response = await fetch(
        `https://api.aq-fes.com/products-api/manufacturers/${Id}/products`,
        {
          headers: {
            "Ocp-Apim-Subscription-Key": "ff99c63e6414429682a09b9da146f038",
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
          },
          cache: "no-store", // Disable caching
        }
      );
      const data = await response.json();
      products.push(...data.data);
    }
    return products; // an array of all product objects from all manufacturers
  } catch (error) {
    console.error(
      `Error getting products:`,
      error.response?.data || error.message
    );
  }
}
async function callAQforCategories() {
  console.log("Calling AQ for categories");

  try {
    // call API
    const response = await fetch(
      `https://api.aq-fes.com/products-api/categories`,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": "ff99c63e6414429682a09b9da146f038",
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );
    const categories = await response.json();
    return categories.data;
  } catch (error) {
    console.error(
      `Error getting categories:`,
      error.response?.data || error.message
    );
  }
}





export async function GET() {
  const cleveland = "9bcbe7a0-be0d-dd11-a23a-00304834a8c9";
  const atosa = "d0865b70-42ae-4fae-90dd-59fef12526e8";

  const aqProducts = await callAQforProducts([atosa, cleveland]);
  const aqCategories = await callAQforCategories();

  const productRelationships = mapRelationships(aqProducts);

  const mappedProducts = [];
  
  try {
    for (const product of aqProducts) {
   
      const mappedProduct = await mapProductCsv(
        product,
        aqCategories,
        productRelationships
      );
      mappedProducts.push(mappedProduct);
    }
    const csvContent = generateCSV(mappedProducts);

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="products.csv"',
      },
    });
  } catch (error) {
    console.error(
      `Error generating CSV:`,
      error.response?.data || error.message
    );
    return NextResponse.json({ error: "Error generating CSV" });
  }
}

export async function POST(req) {
  const authHeader = req.headers.get("Authorization");
  const body = await req.json();
  const { manufacturerIds } = body;

  if (!authHeader || authHeader !== `Bearer ${AQ_SUB_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aqProducts = await callAQforProducts(manufacturerIds);
  const aqCategories = await callAQforCategories();
  const productRelationships = mapRelationships(aqProducts);

  const mappedProducts = [];

  try {
    for (const product of aqProducts) {
      const mappedProduct = await mapProductApi(
        product,
        aqCategories,
        productRelationships
      );
      mappedProducts.push(mappedProduct);
    }

    return new NextResponse(JSON.stringify(mappedProducts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(
      `Error syncing with AQ:`,
      error.response?.data || error.message
    );
    return NextResponse.json({ error: "Error generating products from AQ" });
  }
}
