
## **Installation and Setup**

### **Prerequisites**
- [Node.js](https://nodejs.org) (v14+ recommended)

### **Steps**
1. Clone the repository:
   
   git clone https://github.com/PruthviAsadi/Shoppi--Assignment.gi
   cd Shoppi--Assignment

    Install dependencies:

npm install

Run the application:

    node app.js

API Endpoints
1. Add Domains

POST /domains

Add domains to the list for crawling.
Request Body:

{
  "domains": ["example1.com", "example2.com"]
}

Response:

Domains added

2. Crawl Domains

GET /crawl

Starts crawling all added domains.
Response:

{
  "message": "Crawling completed",
  "results": [
    "https://example1.com/product/123",
    "https://example2.com/item/456"
  ]
}

3. Get Results

GET /results

Retrieve all discovered product URLs.
Response:

[
  {
    "id": 1,
    "domain_id": 1,
    "url": "https://example1.com/product/123"
  },
  {
    "id": 2,
    "domain_id": 2,
    "url": "https://example2.com/item/456"
  }
]

Expected Outputs
Example Execution

    Add Domains:

curl -X POST http://localhost:3000/domains -H "Content-Type: application/json" -d '{"domains":["example1.com","example2.com"]}'

Start Crawling:

curl http://localhost:3000/crawl

Example Response:

{
  "message": "Crawling completed",
  "results": [
    "https://example1.com/product/123",
    "https://example2.com/item/456"
  ]
}

Get Crawling Results:

curl http://localhost:3000/results

Example Response:

[
  {
    "id": 1,
    "domain_id": 1,
    "url": "https://example1.com/product/123"
  },
  {
    "id": 2,
    "domain_id": 2,
    "url": "https://example2.com/item/456"
  }
]
