<?php

declare(strict_types=1);

namespace Trespass\Filter\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magento\Catalog\Model\ResourceModel\Product\Attribute\CollectionFactory;
use Magento\Directory\Model\Currency;
use Magento\Catalog\Helper\Data as CatalogHelper;
use Magento\Catalog\Model\CategoryRepository;

class Toolbar extends Template
{
    private CollectionFactory $productAttributeCollectionFactory;

    private Currency $currency;

    private CatalogHelper $catalogHelper;

    private CategoryRepository $categoryRepository;

    public function __construct(
        Context $context,
        CollectionFactory $productAttributeCollectionFactory,
        Currency $currency,
        CatalogHelper $catalogHelper,
        CategoryRepository $categoryRepository,
        array $data = []
    ) {
        parent::__construct($context, $data);
        $this->productAttributeCollectionFactory = $productAttributeCollectionFactory;
        $this->currency = $currency;
        $this->catalogHelper = $catalogHelper;
        $this->categoryRepository = $categoryRepository;
    }

    public function getParams()
    {
        $params = $this->getRequest()->getParams();
        unset($params["id"]);

        return $params;
    }

    public function getCurrencySymbol()
    {
        return $this->currency->getCurrencySymbol();
    }

    public function getCategoryId() {
        return $this->catalogHelper->getCategory()->getId();
    }

    public function getChildCategories():array {
        $id = $this->getCategoryId();

        $category = $this->categoryRepository->get($id);
        $subCats = $category->getChildrenCategories();

        $catArray = array();

        foreach($subCats as $subCat) {
            $catArray[$subCat->getName()] = $subCat->getUrl();
        }

        return $catArray;
    }
}

