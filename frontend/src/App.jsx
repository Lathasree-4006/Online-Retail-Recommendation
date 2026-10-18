
import { useEffect, useState } from "react";
import {
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import "./App.css";

const API_BASE = "https://online-retail-recommendation-backend.onrender.com/api";
const IMAGE_BASE = "https://online-retail-recommendation-backend.onrender.com";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false);
  const imagePath = product.image_url;

  if (failed || !imagePath) {
    return (
      <div className="product-image-fallback">
        <ShoppingBag size={42} />
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={
        imagePath.startsWith("http")
          ? imagePath
          : `${IMAGE_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
      }
      alt={product.productDisplayName || product.articleType || "Fashion product"}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function App() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState("");
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    fetch(`${API}/health`)
      .then((response) => {
        if (!response.ok) throw new Error("API unavailable");
        return response.json();
      })
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    fetch(`${API}/analytics`)
      .then((response) => {
        if (!response.ok) throw new Error("Analytics unavailable");
        return response.json();
      })
      .then(setAnalytics)
      .catch(() => setAnalytics(null));
  }, []);

  async function searchProducts(event) {
    event.preventDefault();
    setError("");
    setSelected(null);
    setRecommendations([]);

    if (!query.trim()) {
      setProducts([]);
      return;
    }

    setLoadingProducts(true);

    try {
      const response = await fetch(
        `${API}/products?q=${encodeURIComponent(query.trim())}&limit=20`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed.");
      }

      setProducts(data.products || []);

      if (!data.products?.length) {
        setError("No matching fashion products found. Try another search.");
      }
    } catch (err) {
      setError(err.message || "Could not reach the backend.");
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadRecommendations(product) {
    setSelected(product);
    setRecommendations([]);
    setError("");
    setLoadingRecommendations(true);

    try {
      const response = await fetch(
        `${API}/recommendations?product=${encodeURIComponent(product.id)}&limit=5`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not get recommendations.");
      }

      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err.message || "Could not load recommendations.");
    } finally {
      setLoadingRecommendations(false);
    }
  }

  const categoryCounts = analytics?.categories || {};
  const popularTypes = analytics?.popular_article_types || {};

  function renderProductCard(product, isRecommendation = false) {
    return (
      <article className="product-card" key={`${isRecommendation ? "rec" : "product"}-${product.id}`}>
        <div className="product-art">
          <ProductImage product={product} />
        </div>

        <span className="stock-code">
          {product.baseColour || "Fashion"} · ID {product.id}
        </span>

        <h3>{product.productDisplayName || product.articleType || "Fashion product"}</h3>

        <p className="product-details">
          {[product.gender, product.articleType, product.masterCategory]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="product-card-bottom">
          <span className="price">{product.baseColour || "Various colours"}</span>
          {!isRecommendation && (
            <button onClick={() => loadRecommendations(product)}>
              Find similar <Sparkles size={15} />
            </button>
          )}
          {isRecommendation && (
            <span className="similarity-score">
              {product.similarity_score != null
                ? `${(Number(product.similarity_score) * 100).toFixed(1)}% match`
                : "Recommended"}
            </span>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon"><ShoppingBag size={22} /></span>
          <span>Retail<span className="brand-accent">Sense</span></span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#recommendations">Recommendations</a>
          <a href="#analytics">Analytics</a>
        </nav>

        <span className={`api-status ${apiOnline ? "online" : "offline"}`}>
          <span className="status-dot" />
          {apiOnline ? "API Connected" : "API Offline"}
        </span>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">
              <Sparkles size={15} /> MACHINE LEARNING POWERED
            </span>

            <h1>Discover styles<br />you’ll <span>love.</span></h1>

            <p>
              Explore fashion from the Myntra product catalogue and discover
              similar items using machine-learning-based content similarity.
            </p>

            <form className="search-form" onSubmit={searchProducts}>
              <Search size={21} />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try shirts, shoes, blue, women..."
                aria-label="Search fashion products"
              />

              <button type="submit" disabled={loadingProducts}>
                {loadingProducts
                  ? <LoaderCircle className="spin" size={18} />
                  : "Search"}
              </button>
            </form>

            <div className="hero-note">
              <span>✓</span> Explore fashion
              <span>✓</span> Find similar styles
              <span>✓</span> View catalogue insights
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />

            <div className="floating-card card-top">
              <span className="floating-emoji">✨</span>
              <span><b>Smart discovery</b><small>Find your next favourite</small></span>
            </div>

            <div className="product-illustration">
              <div className="illustration-circle">
                <ShoppingBag size={100} strokeWidth={1.1} />
              </div>
              <span className="spark spark-one">✦</span>
              <span className="spark spark-two">✧</span>
              <span className="spark spark-three">✦</span>
            </div>

            <div className="floating-card card-bottom">
              <span className="mini-chart"><TrendingUp size={22} /></span>
              <span><b>Data-driven</b><small>Recommendations</small></span>
            </div>
          </div>
        </section>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss error">×</button>
          </div>
        )}

        <section className="section search-results">
          <div className="section-heading">
            <div>
              <span className="section-kicker">EXPLORE THE CATALOGUE</span>
              <h2>Fashion search</h2>
              <p>Choose an item to discover visually and descriptively similar products.</p>
            </div>

            {products.length > 0 && (
              <span className="result-count">{products.length} results</span>
            )}
          </div>

          {loadingProducts ? (
            <div className="loading-state">
              <LoaderCircle className="spin" /> Searching fashion products...
            </div>
          ) : products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => renderProductCard(product))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><Search size={25} /></div>
              <h3>Find your next style</h3>
              <p>Search for shirts, dresses, shoes, colours, and more.</p>
            </div>
          )}
        </section>

        <section className="section recommendations-section" id="recommendations">
          
<div className="recommendations-heading">
  <h2>Similar products you may like</h2>
  <span className="recommendations-label">
    AI-powered recommendations
  </span>
</div>


          {loadingRecommendations ? (
            <div className="loading-state">
              <LoaderCircle className="spin" /> Finding similar styles...
            </div>
          ) : !selected ? (
            <div className="empty-state recommendation-empty">
              <div className="empty-icon"><Sparkles size={25} /></div>
              <h3>Your recommendations start here</h3>
              <p>Search for a fashion item and click “Find similar”.</p>
            </div>
          ) : recommendations.length > 0 ? (
            <>
              
<div className="selected-product">
  <div className="selected-product-label">
    Selected item
  </div>

  <h3>
    Similar to: {selected.productDisplayName || selected.articleType}
  </h3>

  <p>
    {selected.baseColour || "Colour not specified"} ·{" "}
    {selected.articleType || "Fashion"} · Product ID {selected.id}
  </p>
</div>

              <div className="product-grid">
                {recommendations.map((product) => renderProductCard(product, true))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>No recommendations available</h3>
              <p>Try selecting another product from the search results.</p>
              <button onClick={() => selected && loadRecommendations(selected)}>
                <RefreshCw size={15} /> Try again
              </button>
            </div>
          )}
        </section>

        <section className="section analytics-section" id="analytics">
          <div className="section-heading">
            <div>
              <span className="section-kicker">CATALOGUE OVERVIEW</span>
              <h2>Fashion insights</h2>
              <p>Summary of products available in the dataset.</p>
            </div>
          </div>

          <div className="analytics-grid">
            <article className="analytics-card">
              <span className="analytics-icon"><ShoppingBag size={22} /></span>
              <p>Total products</p>
              <h3>{formatNumber(analytics?.total_products)}</h3>
            </article>

            <article className="analytics-card">
              <span className="analytics-icon"><TrendingUp size={22} /></span>
              <p>Products with images</p>
              <h3>{formatNumber(analytics?.products_with_images)}</h3>
            </article>

            <article className="analytics-card">
              <span className="analytics-icon"><Sparkles size={22} /></span>
              <p>Product categories</p>
              <h3>{formatNumber(Object.keys(categoryCounts).length)}</h3>
            </article>

            <article className="analytics-card">
              <span className="analytics-icon"><TrendingUp size={22} /></span>
              <p>Article types</p>
              <h3>{formatNumber(Object.keys(popularTypes).length)}</h3>
            </article>
          </div>

          
<div className="category-grid">
  {Object.entries(analytics?.categories || {}).map(([category, count]) => {
    const total = analytics?.total_products || 1;
    const percentage = (count / total) * 100;

    return (
      <div className="category-card" key={category}>
        <div className="category-card-top">
          <span className="category-name">{category}</span>
          <span className="category-percentage">
            {percentage.toFixed(1)}%
          </span>
        </div>

        <div className="category-count">
          {Number(count).toLocaleString()} <span>products</span>
        </div>

        <div className="category-progress-track">
          <div
            className="category-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  })}
</div>

        </section>
      </main>

      <footer className="footer">
        <span>RetailSense</span>
        <span>Fashion discovery powered by machine learning</span>
      </footer>
    </div>
  );
}

export default App;
