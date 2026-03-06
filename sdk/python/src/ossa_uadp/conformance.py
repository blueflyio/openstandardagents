"""UADP conformance test runner -- validates any UADP node."""
from __future__ import annotations
import asyncio
import sys
from .client import UadpClient, UadpError
from .validate import validate_manifest, validate_response


async def run_conformance_tests(base_url: str) -> dict:
    """Run conformance tests against a live UADP node."""
    results: list[dict] = []

    async with UadpClient(base_url, timeout=15.0) as client:
        # Test 1: Discovery
        try:
            manifest = await client.discover()
            validation = validate_manifest(manifest.model_dump())
            if validation.valid:
                results.append({"test": "GET /.well-known/uadp.json", "passed": True})
            else:
                results.append({"test": "GET /.well-known/uadp.json", "passed": False, "error": "; ".join(validation.errors)})
        except Exception as e:
            results.append({"test": "GET /.well-known/uadp.json", "passed": False, "error": str(e)})
            return {"url": base_url, "passed": 0, "failed": 1, "results": results}

        # Test 2: Skills
        try:
            m = await client.get_manifest()
            if m.endpoints.skills:
                skills = await client.list_skills(limit=5)
                v = validate_response(skills.model_dump())
                results.append({"test": "GET /uadp/v1/skills", "passed": v.valid, "error": "; ".join(v.errors) if not v.valid else None})
            else:
                results.append({"test": "GET /uadp/v1/skills", "passed": True, "error": "Skipped (not advertised)"})
        except Exception as e:
            results.append({"test": "GET /uadp/v1/skills", "passed": False, "error": str(e)})

        # Test 3: Agents
        try:
            m = await client.get_manifest()
            if m.endpoints.agents:
                agents = await client.list_agents(limit=5)
                v = validate_response(agents.model_dump())
                results.append({"test": "GET /uadp/v1/agents", "passed": v.valid, "error": "; ".join(v.errors) if not v.valid else None})
            else:
                results.append({"test": "GET /uadp/v1/agents", "passed": True, "error": "Skipped (not advertised)"})
        except Exception as e:
            results.append({"test": "GET /uadp/v1/agents", "passed": False, "error": str(e)})

        # Test 4: Federation
        try:
            m = await client.get_manifest()
            if m.endpoints.federation:
                fed = await client.get_federation()
                valid = bool(fed.protocol_version and fed.node_name and isinstance(fed.peers, list))
                results.append({"test": "GET /uadp/v1/federation", "passed": valid, "error": None if valid else "Invalid response shape"})
            else:
                results.append({"test": "GET /uadp/v1/federation", "passed": True, "error": "Skipped (not advertised)"})
        except Exception as e:
            results.append({"test": "GET /uadp/v1/federation", "passed": False, "error": str(e)})

        # Test 5: Pagination
        try:
            m = await client.get_manifest()
            if m.endpoints.skills:
                page1 = await client.list_skills(page=1, limit=1)
                valid = page1.meta.page == 1 and page1.meta.limit == 1 and len(page1.data) <= 1
                results.append({"test": "Pagination (page=1, limit=1)", "passed": valid, "error": None if valid else "Pagination not respected"})
        except Exception as e:
            results.append({"test": "Pagination", "passed": False, "error": str(e)})

    passed = sum(1 for r in results if r["passed"])
    failed = sum(1 for r in results if not r["passed"])
    return {"url": base_url, "passed": passed, "failed": failed, "results": results}


def main():
    """CLI entry point: uadp-test <url>"""
    if len(sys.argv) < 2:
        print("Usage: uadp-test <base-url>")
        print("Example: uadp-test https://marketplace.example.com")
        sys.exit(1)

    url = sys.argv[1]
    print(f"Running UADP conformance tests against {url}...")
    result = asyncio.run(run_conformance_tests(url))

    for r in result["results"]:
        icon = "PASS" if r["passed"] else "FAIL"
        msg = f"  [{icon}] {r['test']}"
        if r.get("error"):
            msg += f" -- {r['error']}"
        print(msg)

    print(f"\n{result['passed']} passed, {result['failed']} failed")
    sys.exit(0 if result["failed"] == 0 else 1)


if __name__ == "__main__":
    main()
