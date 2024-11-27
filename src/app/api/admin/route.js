import { NextResponse } from "next/server";
const AQ_SUB_KEY = process.env.AQ_SUB_KEY;
import specifiProducts from "./ATOSAproducts.json";

async function getSpecifiShortDescriptions() {
  const descriptionMap = {};
  specifiProducts.items.forEach((prod) => {
    if (prod.shortDescriptions?.en) {
      descriptionMap[prod.variant] = prod.shortDescriptions.en;
    }
  });
  return descriptionMap;
}

const mapRelationships = (products) => {
  const skuMap = Object.fromEntries(
    products.map((p) => [p.models.mfrModel, []])
  );

  products.forEach(
    ({
      models: { mfrModel: sku },
      specifications: { AQSpecification: desc },
    }) => {
      if (!sku || !desc) return;

      Object.keys(skuMap).forEach((relatedSku) => {
        if (desc.includes(relatedSku) && relatedSku !== sku) {
          skuMap[sku].push(relatedSku);
          skuMap[relatedSku].push(sku);
        }
      });
    }
  );

  return skuMap;
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
  "meta:certifications",
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
      return null; 
    }

    if (category.subcategories && category.subcategories.length > 0) {
      const foundCategory = category.subcategories.find(
        (sub) => sub.categoryId === categoryId
      );
      if (foundCategory) {
        return category; 
      } else {
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
  return null; 
}

function createCategory(
  category,
  aqCategories,
  categoryHeirarchy = [category.name.replace(/&amp;/g, "&")]
) {
  const fixCategories = (categoryHeirarchy) => {
    if (
      categoryHeirarchy[0] === "Other" ||
      categoryHeirarchy[0] === "Replacement Parts & Accessories"
    ) {
      categoryHeirarchy.shift();
    } else if (categoryHeirarchy[1] === "Cleaning Chemicals") {
      if (categoryHeirarchy[2]) {
        categoryHeirarchy[2] = categoryHeirarchy[2].split(": ")[1];
      }
    } else if (categoryHeirarchy[1] === "Commercial Cooking Equipment") {
      if (categoryHeirarchy[2]) {
        categoryHeirarchy[1] = categoryHeirarchy[2].split(",")[0];
      }
    } else if (categoryHeirarchy[0] === "Warewashing") {
      categoryHeirarchy.shift();
    }

    return categoryHeirarchy.map((cat) =>
      cat.replace(/\b(restaurant|commercial)\b/gi, "").trim()
    );
  };

  const parentCategory = findParentCategory(category.categoryId, aqCategories);

  if (parentCategory) {
    const parentName = parentCategory.name.replace(/&amp;/g, "&");

    categoryHeirarchy.unshift(parentName);

    return createCategory(
      {
        name: parentCategory.name.replace(/&amp;/g, "&"),
        categoryId: parentCategory.categoryId,
      },
      aqCategories,
      categoryHeirarchy
    );
  }


  if (categoryHeirarchy.length > 0) {
    let lastCategory = categoryHeirarchy.pop();

    const excludeTerms = ["Refrigerator / Freezer",];
    
    excludeTerms.forEach(term => {
        if (lastCategory.includes(term)) {
            lastCategory = lastCategory.replace(term, "").trim();
        }
    });

    const additionalCategories = lastCategory.split(", ").map(item => item.trim()).filter(item => item);
    categoryHeirarchy.push(...additionalCategories);
}

  const fixedCategoryHeirarchy = fixCategories(categoryHeirarchy);

  const newCatString = fixedCategoryHeirarchy.join(" > ");
  return newCatString;
}

const mapProductCsv = async (item, aqCategories, productRelationships) => {
  const shortDescriptions = await getSpecifiShortDescriptions();
  const specifyShortDesc =
    shortDescriptions[item.models.mfrModel] ||
    item.specifications?.AQSpecification ||
    "";

  const crossSells = productRelationships[item.models.mfrModel];

  const clevelandId = "9bcbe7a0-be0d-dd11-a23a-00304834a8c9"; 

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
      [`Attribute ${i} name`]: att.property
        .replace(/type/gi, "kind") 
        .replace(/\(Side - side\)/gi, "") 
        .replace(/\(Front - back\)/gi, ""), 

      [`Attribute ${i} value(s)`]: att.value
        .replace(/\(Side - side\)/gi, "") 
        .replace(/\(Front - back\)/gi, ""), 

      [`Attribute ${i} visible`]: "1",
      [`Attribute ${i} global`]: "1",
    };
  });

  const documents = item.documents || [];

  const newProduct = {
    Type: "simple",
    Published: item.mfrId === clevelandId ? "0" : "1", 
    "Visibility in catalog": "visible",
    "In stock?": "1",
    SKU: item.models.mfrModel,
    Name: `${item.brandName} ${item.models.mfrModel}`,
    "Short description": specifyShortDesc,
    Description: item.specifications?.AQSpecification,
    "Weight (lbs)": item.productDimension.shippingWeight,
    "Length (in)": item.productDimension.productDepth,
    "Width (in)": item.productDimension.productWidth,
    "Height (in)": item.productDimension.productHeight,
    "Regular price": item.pricing?.mapMrpPrice?.toFixed(2) || "0.00",
    Categories: categories,
    Tags: item.productCategory.name
      .split(", ")
      .filter((tag) => !/^Refrigerator \/ Freezer/.test(tag))
      .filter((tag) => !/"/.test(tag))
      .map((tag) => tag.trim())
      .join(", "),

    "Shipping class": item.freightClass,
    Images: images,
    "Cross-sells": crossSells.join(", "),
    "meta:brand": item.brandName,
    "meta:certifications": item.certifications,
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

  console.log(newProduct);
  return newProduct;
};

const mapProductApi = async (item, aqCategories, productRelationships) => {
  const { crossSells } = productRelationships;
  const crossSellsField = crossSells[item.models.mfrModel];

  const categories = createCategory(item.productCategory, aqCategories);

  const attributes = item.categoryValues.map((att) => ({
    name: att.property
      .replace(/type/gi, "kind") 
      .replace(/\(Side - side\)/gi, "") 
      .replace(/\(Front - back\)/gi, ""), 

    value: att.value
      .replace(/\(Side - side\)/gi, "") 
      .replace(/\(Front - back\)/gi, ""), 

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

function generateCSV(products) {
  let rows = [];

  rows.push(headers.join(","));

  products.forEach((product) => {
    const productRow = headers
      .map((header) => escapeField(product[header]))
      .join(",");
    rows.push(productRow);
  });

  return rows.join("\n");
}

async function callAQforProducts(manufIds) {
  console.log("Calling AQ for products");
  try {
    const products = [];
    for (const Id of manufIds) {
      const response = await fetch(
        `https://api.aq-fes.com/products-api/manufacturers/${Id}/products`,
        {
          headers: {
            "Ocp-Apim-Subscription-Key": "ff99c63e6414429682a09b9da146f038",
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
          },
          cache: "no-store", 
        }
      );
      const data = await response.json();
      products.push(...data.data);
    }
    return products; 
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
