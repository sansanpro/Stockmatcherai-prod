// Company profile + news (Finnhub, with FMP filling description/HQ/employees)
import { handleCompanyDataRequest } from '../_shared/companyData.ts';

Deno.serve(handleCompanyDataRequest);
