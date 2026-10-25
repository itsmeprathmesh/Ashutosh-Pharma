import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.BASE_URL || "http://127.0.0.1:3100";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(baseUrl)) {
  throw new Error("This load test is restricted to localhost. Do not point it at production.");
}

export const options = {
  scenarios: {
    public_browsing: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "30s", target: 5 },
        { duration: "60s", target: 5 },
        { duration: "30s", target: 10 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500", "p(99)<3000"],
  },
};

const routes = ["/", "/shop", "/about", "/api/categories", "/api/products?q=paracetamol"];

export default function publicBrowsing() {
  const path = routes[Math.floor(Math.random() * routes.length)];
  const response = http.get(`${baseUrl}${path}`, { tags: { route: path.split("?")[0] } });
  check(response, { "status is successful": (result) => result.status >= 200 && result.status < 400 });
  sleep(1);
}
